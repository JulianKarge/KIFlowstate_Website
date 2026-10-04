/* Interactive views share the twelve recorded results in videos.js. */
(() => {
  const models = ['Opus 5.5', 'Sonnet 5.5', 'Sol 6.1', 'Astra'];
  const initials = ['OP', 'SN', 'SL', 'AS'];
  const pick = (de, en) => document.documentElement.lang === 'en' ? en : de;
  const locale = () => document.documentElement.lang === 'en' ? 'en-US' : 'de-DE';
  const number = (n, places = 0) => n.toLocaleString(locale(), {minimumFractionDigits: places, maximumFractionDigits: places});
  const money = n => number(n, 2) + ' $';
  const cost = d => d.low === d.high ? money(d.low) : `${number(d.low, 2)}–${money(d.high)}`;
  const time = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const taskName = t => t === '3D-Erde' ? pick('3D-Erde', '3D Earth') : t;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let observer;

  function aggregate(rows) {
    return models.map(model => {
      const part = rows.filter(r => r.model === model);
      const sum = key => part.reduce((n, r) => n + r[key], 0);
      return {model, low:sum('low'), high:sum('high'), seconds:sum('seconds'), score:sum('score')/part.length, tokens:sum('tokens')};
    });
  }
  function render(rows) {
    return `<div class="kif-benchmark" data-benchmark="${esc(JSON.stringify(rows))}">
      <div class="kb-intro">
        <svg class="kb-wave" viewBox="0 0 800 180" preserveAspectRatio="none" aria-hidden="true"><path d="M-50 135C160 -40 330 240 570 55S860 40 900 120"/><path d="M-50 158C170 -18 340 265 600 78S870 65 900 145"/><path d="M-50 180C180 5 350 290 630 101S880 90 900 168"/></svg>
        <span class="kb-eyebrow">KIFlowstate · ${pick('Praxistest','Practical test')}</span>
        <h4>${pick('Was zählt für dich?','What matters to you?')}</h4>
        <p>${pick('Qualität, Tempo oder Kosten: Entdecke, wo jedes Modell seine Stärken hat.','Quality, speed or cost: explore where each model performs best.')}</p>
        <div class="kb-highlights"></div>
      </div>
      <div class="kb-controls">
        <label>${pick('Aufgabe auswählen','Choose a task')}<select class="kb-task"><option value="all">${pick('Alle drei Tests','All three tests')}</option><option value="3D-Shooter">3D-Shooter</option><option value="3D-Erde">${taskName('3D-Erde')}</option><option value="Jetpack">Jetpack</option></select></label>
        <button class="kb-replay" type="button"><span aria-hidden="true">↻</span> ${pick('Animation wiederholen','Replay animation')}</button>
      </div>
      <div class="kb-panel kb-ranking">
        <div class="kb-panel-heading"><div><span class="kb-eyebrow">${pick('Direktvergleich','Head to head')}</span><h4 class="kb-rank-title"></h4></div><span class="kb-unit"></span></div>
        <div class="kb-metrics" role="group" aria-label="${pick('Vergleichsgröße','Comparison metric')}">
          <button type="button" data-metric="cost" aria-pressed="true">${pick('Kosten','Cost')}</button><button type="button" data-metric="score" aria-pressed="false">${pick('Qualität','Quality')}</button><button type="button" data-metric="time" aria-pressed="false">${pick('Tempo','Speed')}</button>
        </div>
        <p class="kb-chart-note"></p><div class="kb-bars"></div>
        <div class="kb-axis"><span>0</span><span class="kb-scale-max"></span></div>
        <p class="kb-range-note">${pick('Die schraffierte Spitze zeigt die Kostenspanne. Kürzer bedeutet günstiger.','The striped tip shows the cost range. Shorter means cheaper.')}</p>
      </div>
      <div class="kb-panel kb-scatter-panel">
        <div class="kb-panel-heading"><div><span class="kb-eyebrow">${pick('Preis & Ergebnis','Price & result')}</span><h4>${pick('Wie viel Qualität fürs Geld?','How much quality for the money?')}</h4></div></div>
        <p class="kb-scatter-note"></p>
        <div class="kb-scatter"></div>
        <div class="kb-legend" role="group" aria-label="${pick('Modell hervorheben','Highlight a model')}">${models.map((m,i)=>`<button type="button" data-model="${i}" aria-pressed="false"><span class="kb-mark kb-model-${i}">${initials[i]}</span>${m}</button>`).join('')}</div>
        <p class="kb-selection" role="status" aria-live="polite">${pick('Wähle ein Modell, um es in diesem Diagramm hervorzuheben.','Select a model to highlight it in this chart.')}</p>
      </div>
      <div class="kb-table-heading"><div><span class="kb-eyebrow">${pick('Die Zahlen dahinter','Behind the charts')}</span><h4>${pick('Alle Ergebnisse im Detail','Every result in detail')}</h4></div><span class="kb-row-count"></span></div>
      <p class="kb-table-help">${pick('Für alle Spalten die Tabelle seitlich verschieben.','Swipe the table sideways to see all columns.')}</p>
      <div class="kb-table-wrap" role="region" tabindex="0" aria-label="${pick('Testdaten, horizontal scrollbar','Test data, horizontally scrollable')}"><table class="kb-table"><caption class="kb-sr">${pick('Originalwerte aus dem Video, Stand 4. Oktober 2026','Original values from the video, recorded 4 October 2026')}</caption><thead><tr>${[pick('Modell / Aufgabe','Model / task'),pick('Qualität','Quality'),pick('Laufzeit','Runtime'),pick('API-Schätzung','API estimate'), 'Tokens'].map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody></tbody></table></div>
      <details class="kb-method"><summary>${pick('So sind die Zahlen zu lesen','How to read the figures')}</summary><p>${pick('Die zwölf Durchläufe und persönlichen Bewertungen stammen aus dem Video. Bei „Alle drei Tests“ werden Kosten und Laufzeit addiert; Qualität ist der ungewichtete Mittelwert der drei Bewertungen. Bei einer einzelnen Aufgabe werden die Originalwerte angezeigt.','The twelve runs and personal ratings come from the video. “All three tests” adds costs and runtimes; quality is the unweighted mean of the three ratings. An individual task shows its original values.')}</p><p>${pick('USD-Beträge sind API-Kostenschätzungen aus dem Tokenverbrauch, keine zusätzlich bezahlten Abo-Rechnungen. Bandbreiten bleiben erhalten. Im Punktdiagramm liegt der Punkt in der Mitte der Kostenspanne; die horizontale Linie zeigt ihre Grenzen. Tokens werden wie im Video angegeben wiedergegeben und nicht neu abgerechnet.','USD amounts are estimated API costs based on token usage, not extra subscription charges. Ranges are preserved. Scatter points use the midpoint of each cost range; horizontal lines show its boundaries. Token totals are reproduced from the video, not used for a new billing calculation.')}</p></details>
    </div>`;
  }

  function update(root, rows, state) {
    const filtered = rows.filter(r => state.task === 'all' || r.task === state.task);
    const totals = aggregate(filtered);
    const cheapest = [...totals].sort((a,b)=>a.high-b.high)[0];
    const fastest = [...totals].sort((a,b)=>a.seconds-b.seconds)[0];
    const best = Math.max(...totals.map(r=>r.score));
    const winners = totals.filter(r=>r.score===best).map(r=>r.model).join(' / ');
    root.querySelector('.kb-highlights').innerHTML = `<div><span>${pick('Günstigster Lauf','Lowest cost')}${state.task==='all' ? pick(' · gesamt',' · total') : ''}</span><strong>${cost(cheapest)}</strong><small>${cheapest.model}</small></div><div><span>${pick('Höchste Bewertung','Highest score')}${state.task==='all' ? ' · Ø' : ''}</span><strong>${number(best,1)}<em>/10</em></strong><small>${winners}</small></div><div><span>${pick('Kürzeste Laufzeit','Shortest runtime')}${state.task==='all' ? pick(' · gesamt',' · total') : ''}</span><strong>${time(fastest.seconds)}<em> min</em></strong><small>${fastest.model}</small></div>`;
    const metric = state.metric;
    const val = d => metric==='cost' ? d.high : metric==='score' ? d.score : d.seconds/60;
    const sorted = [...totals].sort((a,b)=>metric==='score' ? val(b)-val(a) : val(a)-val(b));
    const max = metric==='score' ? 10 : metric==='cost' ? Math.ceil(Math.max(...totals.map(val))/5)*5 : Math.ceil(Math.max(...totals.map(val))/10)*10;
    root.querySelector('.kb-rank-title').textContent = metric==='cost' ? pick('Kosten im Vergleich','Cost comparison') : metric==='score' ? pick('Qualität im Vergleich','Quality comparison') : pick('Laufzeit im Vergleich','Runtime comparison');
    root.querySelector('.kb-unit').textContent = metric==='cost' ? 'USD' : metric==='score' ? pick('Punkte / 10','Score / 10') : pick('Minuten','Minutes');
    root.querySelector('.kb-chart-note').textContent = state.task==='all' ? pick('Alle drei Tests · Kosten und Zeit als Summe, Qualität als Mittelwert.','All three tests · total costs and time, average quality.') : taskName(state.task)+pick(' · ein Durchlauf je Modell.',' · one run per model.');
    if(metric==='cost') root.querySelector('.kb-chart-note').textContent += pick(' Nach oberer Kostengrenze sortiert.',' Sorted by upper cost estimate.');
    root.querySelector('.kb-scale-max').textContent = number(max)+(metric==='cost' ? ' $' : metric==='time' ? ' min' : '');
    root.querySelector('.kb-range-note').textContent = metric==='cost' ? pick('Die schraffierte Spitze zeigt die Kostenspanne. Kürzer bedeutet günstiger.','The striped tip shows the cost range. Shorter means cheaper.') : metric==='score' ? pick('Länger bedeutet höher bewertet. Persönliche Bewertung von 1 bis 10.','Longer means a higher score. Personal ratings from 1 to 10.') : pick('Kürzer bedeutet schneller. Laufzeit der aufgezeichneten Durchläufe.','Shorter means faster. Runtime of the recorded runs.');
    root.querySelector('.kb-bars').innerHTML = sorted.map((d,i)=>{
      const m=models.indexOf(d.model), label=metric==='cost'?cost(d):metric==='score'?number(d.score,1)+'/10':time(d.seconds)+' min';
      return `<div class="kb-bar-row kb-model-${m}" data-highlight="${m}" style="--kb-stagger:${i*65}ms"><div class="kb-bar-label"><span><b class="kb-model-dot"></b>${d.model}</span><strong>${label}</strong></div><div class="kb-track"><div class="kb-fill" style="width:${val(d)/max*100}%">${metric==='cost'&&d.high>d.low?`<span class="kb-range" style="width:${(d.high-d.low)/d.high*100}%"></span>`:''}</div></div></div>`;
    }).join('');
    root.querySelectorAll('[data-metric]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.metric===metric)));

    // Both axes start at zero. Range endpoints are preserved instead of collapsed to exact prices.
    const xmax = Math.ceil(Math.max(...totals.map(d=>d.high))/5)*5;
    const x = n=>64+n/xmax*550, y=n=>272-n/10*220;
    const grid = [0,2,4,6,8,10].map(n=>`<line x1="64" y1="${y(n)}" x2="614" y2="${y(n)}"/><text x="48" y="${y(n)+4}" text-anchor="end">${n}</text>`).join('');
    const xticks = [0,1,2,3].map(i=>{const n=xmax*i/3;return `<text x="${x(n)}" y="296" text-anchor="middle">${number(n,n%1?1:0)} $</text>`}).join('');
    root.querySelector('.kb-scatter-note').textContent = pick('Weiter oben: besser bewertet. Weiter links: günstiger.','Higher: better rated. Further left: cheaper.');
    root.querySelector('.kb-scatter').innerHTML = `<svg viewBox="0 0 680 340" role="img" aria-label="${pick('Vergleich von API-Kostenschätzung und Bewertung. Alle exakten Werte stehen in der Tabelle.','Estimated API cost versus score. All exact values are in the table.')}"><g class="kb-grid">${grid}${xticks}</g><text class="kb-axis-label" x="64" y="24">${state.task==='all'?'Ø ':''}${pick('Bewertung / 10','Score / 10')}</text><text class="kb-axis-label" x="340" y="330" text-anchor="middle">${state.task==='all'?pick('API-Schätzung gesamt','Total API estimate'):pick('API-Schätzung','API estimate')} (USD)</text>${totals.map((d,i)=>`<g class="kb-point kb-model-${i}" data-highlight="${i}" style="--kb-stagger:${i*90}ms"><title>${d.model}: ${number(d.score,1)}/10 · ${cost(d)}</title><line x1="${x(d.low)}" x2="${x(d.high)}" y1="${y(d.score)}" y2="${y(d.score)}"/><circle cx="${x((d.low+d.high)/2)}" cy="${y(d.score)}" r="18"/><text x="${x((d.low+d.high)/2)}" y="${y(d.score)+4}" text-anchor="middle">${initials[i]}</text></g>`).join('')}</svg>`;
    root.querySelector('.kb-row-count').textContent = `${filtered.length} ${pick('Ergebnisse','results')}`;
    root.querySelector('tbody').innerHTML = filtered.map((r,i)=>{
      const m=models.indexOf(r.model), first=i===0||filtered[i-1].model!==r.model;
      return `<tr class="kb-model-${m}${first?' kb-model-start':''}" data-highlight="${m}"><th scope="row"><span class="kb-table-model"><b class="kb-model-dot"></b>${r.model}</span><span class="kb-table-task">${taskName(r.task)}</span></th><td><span class="kb-score">${r.score}<small>/10</small></span><span class="kb-score-track"><i style="width:${r.score*10}%"></i></span></td><td class="kb-numeric">${time(r.seconds)}<small> min</small></td><td class="kb-numeric kb-cost">${cost(r)}</td><td class="kb-numeric kb-token">${number(r.tokens)}</td></tr>`;
    }).join('');
    highlight(root, totals, state);
  }
  function highlight(root, totals, state) {
    root.querySelectorAll('.kb-scatter [data-highlight]').forEach(el=>el.classList.toggle('kb-dim',state.model!==null&&+el.dataset.highlight!==state.model));
    root.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.model===state.model)));
    const d=totals[state.model];
    root.querySelector('.kb-selection').textContent = d ? `${d.model} · ${number(d.score,1)}/10 · ${cost(d)} · ${time(d.seconds)} min` : pick('Wähle ein Modell, um es in diesem Diagramm hervorzuheben.','Select a model to highlight it in this chart.');
  }
  function animate(root) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('.kb-fill').forEach((el,i)=>el.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:850,delay:i*65,easing:'cubic-bezier(0.2,0,0,1)',fill:'backwards'}));
    root.querySelectorAll('.kb-point').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:750,delay:150+i*90,easing:'cubic-bezier(0.2,0,0,1)',fill:'backwards'}));
    root.querySelectorAll('.kb-highlights > div').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,delay:i*75,fill:'backwards'}));
    root.querySelectorAll('.kb-score-track i').forEach((el,i)=>el.animate([{transform:'scaleX(0)',transformOrigin:'left'},{transform:'scaleX(1)',transformOrigin:'left'}],{duration:650,delay:i*35,easing:'ease-out',fill:'backwards'}));
    root.querySelector('.kb-wave')?.animate([{transform:'translateX(-6%)',opacity:.2},{transform:'translateX(0)',opacity:1}],{duration:1400,easing:'ease-out'});
  }
  function refresh() {
    observer?.disconnect();
    observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){animate(e.target);observer.unobserve(e.target)}}),{threshold:.2});
    document.querySelectorAll('[data-benchmark]').forEach(root=>{
      if(root.dataset.ready)return;
      root.dataset.ready='true';
      const rows=JSON.parse(root.dataset.benchmark),state={task:'all',metric:'cost',model:null};
      update(root,rows,state);
      root.querySelector('.kb-task').addEventListener('change',e=>{state.task=e.target.value;update(root,rows,state);animate(root)});
      root.addEventListener('click',e=>{
        const metric=e.target.closest('[data-metric]');
        if(metric){state.metric=metric.dataset.metric;update(root,rows,state);animate(root)}
        const model=e.target.closest('[data-model]');
        if(model){const index=+model.dataset.model;state.model=state.model===index?null:index;highlight(root,aggregate(rows.filter(r=>state.task==='all'||r.task===state.task)),state)}
        if(e.target.closest('.kb-replay'))animate(root);
      });
      root.querySelectorAll('.kb-intro,.kb-panel,.kb-table-wrap').forEach(panel=>observer.observe(panel));
    });
  }
  window.KIBenchmark={render,refresh};
})();
