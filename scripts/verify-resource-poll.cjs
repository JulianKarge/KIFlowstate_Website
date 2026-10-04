// Run with: node scripts/verify-resource-poll.cjs
// Network and storage are simulated; no votes are sent to production.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/resource-poll.js'), 'utf8');
const pollId = 'KwY-WioBPvc-full-setup';
const key = 'kif_resource_vote:' + pollId;

function harness({ saved, blockedStorage = false, filtered = false, missingCounter = false } = {}) {
  const stored = new Map(saved ? [[key, saved]] : []);
  const listeners = {};
  const images = [];
  const requests = [];
  const timers = new Map();
  const buttons = ['yes', 'no'].map(choice => ({
    dataset: { pollChoice: choice }, disabled: false, attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    closest(selector) { return selector === '.resource-poll' ? poll : this; },
  }));
  const status = { textContent: '', classList: { toggle() {} } };
  const poll = {
    dataset: { pollId }, attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    querySelectorAll() { return buttons; }, querySelector() { return status; },
  };
  const document = {
    documentElement: { lang: 'de' },
    querySelectorAll() { return [poll]; },
    addEventListener(name, fn) { listeners[name] = fn; },
  };
  const window = {
    addEventListener(name, fn) { listeners[name] = fn; },
    goatcounter: missingCounter ? undefined : {
      filter() { return filtered; },
      url(data) { requests.push(data); return 'https://example.test/count'; },
    },
  };
  vm.runInNewContext(source, {
    document, window,
    localStorage: {
      getItem(k) { if (blockedStorage) throw Error('blocked'); return stored.get(k); },
      setItem(k, v) { if (blockedStorage) throw Error('blocked'); stored.set(k, v); },
    },
    Image: class { constructor() { images.push(this); } },
    setTimeout(fn, ms) {
      if (ms <= 100) { queueMicrotask(fn); return 0; }
      const id = timers.size + 1; timers.set(id, fn); return id;
    },
    clearTimeout(id) { timers.delete(id); },
  });
  window.KIResourcePoll.refresh();
  return { stored, buttons, status, poll, document, requests, images, timers, window,
    click(i) { return listeners.click({ target: buttons[i] }); },
    sync(value) { listeners.storage({ key, newValue: value }); },
  };
}

(async () => {
  for (const choice of ['yes', 'no']) {
    const h = harness();
    const sending = h.click(choice === 'yes' ? 0 : 1);
    assert(h.buttons.every(b => b.disabled), 'disable both options while sending');
    await h.click(1);
    assert.equal(h.requests.length, 1, 'ignore repeated clicks');
    await Promise.resolve();
    assert.equal(h.stored.size, 0, 'do not save before a response');
    h.images[0].onload();
    await sending;
    assert.equal(h.requests[0].path, `vote-${pollId}-${choice}`);
    assert.equal(h.requests[0].event, true);
    assert.equal(h.stored.get(key), choice);
    assert.match(h.status.textContent, /übermittelt/);
    assert.equal(h.buttons[choice === 'yes' ? 0 : 1].attrs['aria-pressed'], 'true');
    await h.click(1);
    assert.equal(h.requests.length, 1, 'do not send another vote');
    const reloaded = harness({ saved: choice });
    assert(reloaded.buttons.every(b => b.disabled), 'restore vote on reload');
  }

  const failed = harness();
  const first = failed.click(0);
  await Promise.resolve(); failed.images[0].onerror(); await first;
  assert.equal(failed.stored.size, 0);
  assert(failed.buttons.every(b => !b.disabled), 'allow retry after failure');
  assert.match(failed.status.textContent, /nicht gesendet/);
  const retry = failed.click(1);
  await Promise.resolve(); failed.images[1].onload(); await retry;
  assert.equal(failed.stored.get(key), 'no');

  const timeout = harness();
  const delayed = timeout.click(0);
  await Promise.resolve(); [...timeout.timers.values()][0](); await delayed;
  assert.equal(timeout.stored.size, 0);
  assert(timeout.buttons.every(b => !b.disabled));

  for (const options of [{ filtered: true }, { missingCounter: true }]) {
    const h = harness(options); await h.click(0);
    assert.equal(h.images.length, 0);
    assert.equal(h.stored.size, 0);
    assert.match(h.status.textContent, /nicht gesendet/);
  }

  const privateBrowser = harness({ blockedStorage: true });
  const vote = privateBrowser.click(0);
  await Promise.resolve(); privateBrowser.images[0].onload(); await vote;
  assert(privateBrowser.buttons.every(b => b.disabled), 'keep session vote if storage is blocked');
  privateBrowser.document.documentElement.lang = 'en';
  privateBrowser.window.KIResourcePoll.refresh();
  assert.match(privateBrowser.status.textContent, /YES.*submitted/);

  const otherTab = harness(); otherTab.sync('no');
  assert(otherTab.buttons.every(b => b.disabled), 'sync another tab’s vote');
  assert.equal(otherTab.buttons[1].attrs['aria-pressed'], 'true');
  console.log('PASS: YES/NO delivery, repeat clicks, reload, retry, timeout, blocked analytics/storage, language switch, and tab sync.');
})().catch(error => { console.error(error); process.exitCode = 1; });
