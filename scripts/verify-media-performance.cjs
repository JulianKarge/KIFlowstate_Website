// Run with: node scripts/verify-media-performance.cjs
// Requires the existing local Playwright installation and its Chromium/Firefox.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { createStaticServer, loadPlaywright, openShowcase } = require('./verify-invoice-showcase-video.cjs');
const { chromium, firefox, webkit } = loadPlaywright();
const output = path.resolve(__dirname, '../.qa/media-performance');
fs.mkdirSync(output, {recursive:true});
const reports = [];

async function hero(browser, origin, spec) {
  const context = await browser.newContext({viewport:spec.viewport, deviceScaleFactor:2,
    reducedMotion:spec.reduced ? 'reduce' : 'no-preference'});
  if (spec.noWebGL) await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === 'webgl2' ? null : original.call(this, type, ...args);
    };
  });
  await context.addInitScript(() => {
    window.__heroDraws = 0;
    const original = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function(...args) {
      if (this.canvas.classList.contains('hero-logo-canvas')) window.__heroDraws++;
      return original.apply(this,args);
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(origin, {waitUntil:'load'});
    await page.waitForFunction(() => document.querySelector('#hero-logo-3d').classList.contains('is-ready') ||
      document.querySelector('#hero-logo-3d').classList.contains('is-fallback'));
    await page.waitForTimeout(1800);
    const state = await page.locator('#hero-logo-3d').evaluate(stage => ({
      ready:stage.classList.contains('is-ready'), fallback:stage.classList.contains('is-fallback'),
      imageOpacity:getComputedStyle(stage.querySelector('img')).opacity,
      canvasCount:stage.querySelectorAll('canvas').length,
      bufferWidth:stage.querySelector('canvas')?.width,
      overflow:document.documentElement.scrollWidth > innerWidth,
      dropping:stage.classList.contains('is-site-dropping')
    }));
    assert.deepEqual(errors, [], spec.name + ' runtime errors');
    assert.equal(state.overflow, false, spec.name + ' overflow');
    assert.equal(state.dropping, false, spec.name + ' entrance restored to layout');
    if (spec.noWebGL) {
      assert.equal(state.fallback, true); assert.equal(state.imageOpacity,'1');
    } else {
      assert.equal(state.ready,true); assert.equal(state.canvasCount,1); assert(state.bufferWidth <= 800);
      // Verify actual drawing stops, rather than trusting a CSS pause class.
      if (spec.reduced) {
        const before=await page.evaluate(()=>window.__heroDraws);
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(()=>window.__heroDraws), before);
      } else {
        const stage=page.locator('#hero-logo-3d');
        if(spec.viewport.width > 860) {
          const box=await stage.boundingBox();
          await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
          await page.mouse.down(); await page.mouse.move(box.x+box.width/2+60,box.y+box.height/2+20,{steps:6});
          assert(await stage.evaluate(el=>el.classList.contains('is-grabbing')));
          await page.mouse.up();
          assert(!await stage.evaluate(el=>el.classList.contains('is-grabbing')));
        }
        await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
        await page.waitForTimeout(350);
        const before=await page.evaluate(()=>window.__heroDraws);
        await page.waitForTimeout(350);
        assert.equal(await page.evaluate(()=>window.__heroDraws),before, 'offscreen GPU draws');
        await page.evaluate(()=>scrollTo(0,0));
        await page.waitForTimeout(350);
        assert((await page.evaluate(()=>window.__heroDraws)) > before,'hero resumes on return');
      }
    }
    await page.screenshot({path:path.join(output,spec.name+'.png')});
    reports.push({name:spec.name,...state});
    console.log('PASS '+spec.name);
  } finally { await context.close(); }
}

async function lifecycle(browser,origin) {
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.goto(origin);
    // Change mode while shader compilation is in flight.
    await page.setViewportSize({width:834,height:1000});
    await page.waitForFunction(()=>document.querySelector('#hero-logo-3d.is-ready.is-background-mode'));
    for (const width of [1100,390,1366]) {
      await page.setViewportSize({width,height:768});
      await page.waitForFunction(background=>{
        const el=document.querySelector('#hero-logo-3d');
        return el.classList.contains('is-ready') && el.classList.contains('is-background-mode')===background &&
          el.querySelectorAll('canvas').length===1;
      },width<=860);
    }
    await page.waitForFunction(()=>!document.querySelector('#hero-logo-3d').classList.contains('is-site-dropping'));
    const loss=await page.evaluate(()=>{
      const canvas=document.querySelector('.hero-logo-canvas');
      const ext=canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
      if (!ext) return false;
      window.__restoreGL=ext;ext.loseContext();return true;
    });
    assert(loss,'context loss extension available');
    await page.waitForFunction(()=>document.querySelector('#hero-logo-3d.is-fallback') &&
      getComputedStyle(document.querySelector('.hero-logo-fallback')).opacity==='1');
    await page.evaluate(()=>window.__restoreGL.restoreContext());
    await page.waitForFunction(()=>document.querySelector('#hero-logo-3d.is-ready:not(.is-fallback)'));
    assert.deepEqual(errors,[]);
    reports.push({name:'resize + GPU context recovery',pass:true});console.log('PASS resize + GPU context recovery');
  } finally {await context.close();}
}

async function playback(browser,origin,spec) {
  const {context,page,errors,mediaRequests}=await openShowcase(browser,origin,{
    viewport:spec.viewport,reducedMotion:'no-preference',deviceScaleFactor:2});
  try {
    let session;
    if(spec.throttle) {
      session=await context.newCDPSession(page);
      await session.send('Emulation.setCPUThrottlingRate',{rate:4});
      await session.send('Performance.enable');
    }
    await page.waitForFunction(()=>{
      const v=document.querySelector('video.is-active');return !v.paused && v.readyState >= 3 && v.currentTime > 1.25;
    });
    // WebKit's Windows test port exposes playback-quality counters as zero.
    // Count submitted frames via the compositor callback in that case.
    await page.locator('video.is-active').evaluate(v=>{
      if (v.getVideoPlaybackQuality().totalVideoFrames || !v.requestVideoFrameCallback) return;
      v.__probeFrames = 0;
      const probe = (_now, metadata) => {
        v.__probeFrames = metadata.presentedFrames;
        v.__probeCallback = v.requestVideoFrameCallback(probe);
      };
      v.__probeCallback = v.requestVideoFrameCallback(probe);
    });
    const sample=()=>page.locator('video.is-active').evaluate(v=>{
      const q=v.getVideoPlaybackQuality();return {time:v.currentTime,total:q.totalVideoFrames || v.__probeFrames || 0,
        dropped:q.totalVideoFrames ? q.droppedVideoFrames : null};
    });
    const first=await sample();
    const firstFrame = !first.total ? await page.locator('video.is-active').screenshot() : null;
    await page.waitForTimeout(5000);
    const last=await sample();
    const stats={name:spec.name,advanced:last.time-first.time,total:last.total-first.total,
      dropped:last.dropped === null ? null : last.dropped-first.dropped};
    await page.locator('video.is-active').evaluate(v=>{
      if (v.__probeCallback != null) v.cancelVideoFrameCallback(v.__probeCallback);
    });
    assert(stats.advanced>4.4,JSON.stringify(stats));
    if (stats.total === 0 && stats.dropped === null && firstFrame) {
      const lastFrame = await page.locator('video.is-active').screenshot();
      assert(!firstFrame.equals(lastFrame),'video pixels must advance when frame counters are unavailable');
      stats.total = null;
      stats.frameCountersAvailable = false;
      stats.visualPlaybackVerified = true;
    } else {
      assert(stats.total >= 260,'60 fps video must present frames throughout the sample: '+JSON.stringify(stats));
    }
    if(stats.dropped !== null) assert(stats.dropped / stats.total < .05,'dropped frames: '+JSON.stringify(stats));
    assert(mediaRequests.every(url=>!url.includes('-en-')),'no inactive language media');
    await page.locator('[data-showcase-toggle]').click();
    const paused=await sample(); await page.waitForTimeout(300);
    assert(Math.abs((await sample()).time-paused.time)<.1,'pause holds frame');
    await page.locator('[data-showcase-chapter="review"]').click();
    await page.waitForFunction(()=>Math.abs(document.querySelector('video.is-active').currentTime-14.82)<.15);
    const requestCount=mediaRequests.length;
    await page.locator('[data-showcase-chapter="send"]').click();
    await page.waitForFunction(()=>Math.abs(document.querySelector('video.is-active').currentTime-21.84)<.15);
    assert(mediaRequests.slice(requestCount).every(url=>!url.includes('-en-')),'seek does not wake hidden decoder');
    await page.screenshot({path:path.join(output,spec.name+'.png')});
    await page.locator('[data-showcase-toggle]').click();
    await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
    await page.waitForFunction(()=>document.querySelector('video.is-active').paused);
    assert.deepEqual(errors,[]);
    reports.push(stats);console.log('PASS '+spec.name+' '+JSON.stringify(stats));
  } finally {await context.close();}
}

async function robustness(browser,origin) {
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.route('**/invoice-showcase-*.mp4*',route=>route.abort());
    await page.goto(origin+'/rechnung-demo.html');
    await page.locator('[data-showcase]').evaluate(el=>el.scrollIntoView({block:'center'}));
    await page.waitForFunction(()=>document.querySelector('[data-showcase]').dataset.showcaseVideoError);
    assert.equal(await page.locator('.invoice-showcase-video-loading').isVisible(),false,'media failure clears spinner');
    assert(await page.locator('video.is-active').evaluate(v=>!!v.poster),'failure retains poster');
    await page.unroute('**/invoice-showcase-*.mp4*');
    await page.locator('[data-showcase-toggle]').click();
    // Playwright scrolls the heading control into view before clicking it;
    // return the film to view so its intentional offscreen pause can clear.
    await page.locator('[data-showcase]').evaluate(el=>el.scrollIntoView({block:'center'}));
    await page.waitForFunction(()=>document.querySelector('video.is-active').currentTime>0.3);
    await page.locator('[data-showcase-toggle]').click();
    const position=await page.locator('video.is-active').evaluate(v=>v.currentTime);
    await page.setViewportSize({width:1100,height:900});
    await page.waitForFunction(()=>{
      const v=document.querySelector('video.is-active');
      return v.currentSrc.includes('-laptop.mp4') && v.readyState>=2 && !v.seeking;
    });
    const resized=await page.locator('video.is-active').evaluate(v=>({time:v.currentTime,paused:v.paused}));
    assert(resized.paused && Math.abs(resized.time-position)<.25,'resize preserves pause/time');
    await page.locator('[data-showcase-scrubber]').focus();
    await page.keyboard.press('End');
    await page.waitForFunction(()=>document.querySelector('video.is-active').currentTime>25.9);
    await page.locator('[data-showcase-toggle]').click();
    await page.locator('[data-showcase]').evaluate(el=>el.scrollIntoView({block:'center'}));
    await page.waitForFunction(()=>Number(document.querySelector('[data-showcase]').dataset.showcaseCycle)>0);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>{
      const v=document.querySelector('video.is-active');return v.paused && !v.seeking && Math.abs(v.currentTime-21.84)<.1;
    });
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(()=>!document.querySelector('video.is-active').paused);
    assert.deepEqual(errors,[]);
    reports.push({name:'video failure/retry, resize, keyboard, loop, motion changes',pass:true});
    console.log('PASS video failure/retry, resize, keyboard, loop, motion changes');
  } finally {await context.close();}
}

(async()=>{
  const server=createStaticServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let chrome,fox,safari;
  try {
    chrome=await chromium.launch();
    if (!process.argv.includes('--video-only')) for(const spec of [
      {name:'hero-laptop',viewport:{width:1366,height:768}},
      {name:'hero-small-laptop',viewport:{width:1100,height:768}},
      {name:'hero-mobile',viewport:{width:390,height:844}},
      {name:'hero-reduced-motion',viewport:{width:1366,height:768},reduced:true},
      {name:'hero-no-webgl',viewport:{width:1366,height:768},noWebGL:true}
    ])await hero(chrome,origin,spec);
    if (!process.argv.includes('--video-only')) await lifecycle(chrome,origin);
    if (!process.argv.includes('--hero-only') && !process.argv.includes('--cross-browser-only')) for(const [name,viewport] of [
      ['video-laptop',{width:1366,height:768}],['video-small-laptop',{width:1100,height:768}],
      ['video-tablet',{width:834,height:1194}],['video-mobile',{width:390,height:844}]
    ])await playback(chrome,origin,{name,viewport,throttle:true});
    if (!process.argv.includes('--hero-only') && !process.argv.includes('--cross-browser-only')) await robustness(chrome,origin);
    fox=await firefox.launch();
    if (!process.argv.includes('--video-only')) await hero(fox,origin,{name:'hero-firefox',viewport:{width:1366,height:768}});
    if (!process.argv.includes('--hero-only')) await playback(fox,origin,{name:'video-firefox',viewport:{width:1366,height:768}});
    safari=await webkit.launch();
    if (!process.argv.includes('--video-only')) await hero(safari,origin,{name:'hero-webkit',viewport:{width:1366,height:768}});
    if (!process.argv.includes('--hero-only')) await playback(safari,origin,{name:'video-webkit',viewport:{width:1366,height:768}});
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(reports,null,2));
    console.log('PASS all media performance checks');
  } finally {
    if(chrome)await chrome.close(); if(fox)await fox.close(); if(safari)await safari.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
