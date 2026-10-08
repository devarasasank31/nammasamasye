import { writeFileSync } from 'node:fs';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const RESULTS = process.env.TEMP + '\\opencode\\when_e2e_results.txt';

async function main() {
  // Open a FRESH target every run — prior runs can leave a wedged renderer.
  let page;
  try {
    const nu = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3100/report', { method: 'PUT' });
    page = await nu.json();
  } catch {
    const list0 = await (await fetch('http://127.0.0.1:9222/json/list')).json();
    page = list0.find(t => t.type === 'page');
  }
  await sleep(1500);
  // Close other page targets so nothing stale competes for attention.
  try {
    const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
    for (const t of list) {
      if (t.type === 'page' && t.id !== page.id) await fetch('http://127.0.0.1:9222/json/close/' + t.id);
    }
  } catch {}
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const consoleErrors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') consoleErrors.push('EXC: ' + (m.params.exceptionDetails.exception?.description || 'unknown'));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push('CONSOLE: ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrors.push('LOG: ' + m.params.entry.text);
  };
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    const to = setTimeout(() => { pending.delete(i); rej(new Error('CDP timeout: ' + method)); }, 20000);
    pending.set(i, (m) => { clearTimeout(to); res(m); });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r?.result?.exceptionDetails) return 'EXC: ' + (r.result.exceptionDetails.exception?.description || 'unknown');
    return r?.result?.result?.value;
  };
  const text = async () => (await ev('document.body.innerText')) || '';
  const has = async (n) => (await text()).includes(n);
  const clickBtn = async (t) => ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim().split('\\n').map(s => s.trim()).pop() === ${JSON.stringify(t)}); if (!b) return 'NOT_FOUND'; b.click(); return 'CLICKED'; })()`);
  const clickMatch = async (src) => ev(`(() => { const re = new RegExp(${JSON.stringify(src)}); const b = Array.from(document.querySelectorAll('button')).find(x => re.test(x.innerText.trim())); if (!b) return 'NOT_FOUND'; b.click(); return 'CLICKED'; })()`);
  const inputReady = async () => (await ev(`!!document.querySelector('.sticky input[type="text"]')`)) === true;
  const typeInto = async (t) => ev(`(() => {
    const el = document.querySelector('.sticky input[type="text"]');
    if (!el) return 'NO_INPUT';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(t)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return 'OK';
  })()`);
  const pressEnter = async () => ev(`(() => {
    const el = document.querySelector('.sticky input[type="text"]');
    if (!el) return 'NO_INPUT';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    return 'ENTER';
  })()`);
  const waitUntil = async (fn, ms = 12000, step = 300) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      let v; try { v = await fn(); } catch { v = false; }
      if (v) return true;
      await sleep(step);
    }
    return false;
  };
  const results = [];
  const check = (name, ok) => results.push([name, !!ok]);
  const chipClass = async (label) => ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim().includes(${JSON.stringify(label)})); return b ? b.className : 'NONE'; })()`);
  const continueDisabled = async () => ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim().includes('Continue')); return b ? String(b.disabled) : 'NONE'; })()`);
  const setInput = async (sel, val) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 'NO_EL'; const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(el, ${JSON.stringify(val)}); el.dispatchEvent(new Event('input', { bubbles: true })); return 'OK'; })()`);

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

  const reset = async (tag) => {
    await ev(`(() => { ['ns_incidents','ns_session_id','ns_id_counter','ns_custom_problems','ns_cookie_consent','ns_language'].forEach(k => localStorage.removeItem(k)); document.cookie = 'ns_cookie_consent=; max-age=0; path=/'; return true; })()`);
    await send('Page.navigate', { url: 'http://localhost:3100/report' });
    await sleep(5500);
    await ev(`(() => { const b = document.querySelector('[data-testid="cookie-accept"]'); if (b) { b.click(); return 1; } return 0; })()`);
    await sleep(900);
    check(tag + '0 category grid', await waitUntil(async () => (await ev(`Array.from(document.querySelectorAll('button')).some(b => b.innerText.trim().split('\\n').pop().trim() === 'Illegal Parking')`)) === true, 10000));
  };

  const answerLocation = async (tag) => {
    check(tag + 'L1 map opened', await waitUntil(async () => (await ev(`!!document.querySelector('.leaflet-container')`)) === true, 15000));
    await ev(`document.querySelector('.leaflet-container').scrollIntoView({block:'center'})`);
    await sleep(700);
    const rect = JSON.parse(await ev(`(() => { const r = document.querySelector('.leaflet-container').getBoundingClientRect(); return JSON.stringify({x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2)}); })()`));
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    check(tag + 'L2 pin dropped', await waitUntil(async () => /\d{1,2}\.\d{3,}[\s,]+77\.\d{3,}/.test(await text()), 12000));
    await waitUntil(async () => await has('Use this location'), 10000);
    let clickedOnce = false;
    await waitUntil(async () => {
      const tx = await text();
      if (/Detected: Ward/.test(tx)) return true;
      if (tx.includes('Use this location')) {
        const r = await clickBtn('Use this location');
        if (r === 'CLICKED') clickedOnce = true;
      }
      return false;
    }, 30000);
    check(tag + 'L3 location used', clickedOnce);
    check(tag + 'L4 next question ready', await waitUntil(inputReady, 20000));
  };

  // Parking workflow order (proven by prior E2E): location → description → evidence → boolean → when.
  const walkToWhen = async (tag, descText) => {
    await answerLocation(tag);
    if (await waitUntil(inputReady, 15000)) {
      check(tag + 'L5 typed description', (await typeInto(descText)) === 'OK');
      await sleep(300); await pressEnter(); await sleep(1200);
    }
    const evSkip = await waitUntil(async () => (await ev(`Array.from(document.querySelectorAll('button')).some(b => /^Skip\\s*[\\u2010-\\u2015-]?\\s*No evidence/i.test(b.innerText.trim()))`)), 12000);
    if (evSkip) { await ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find(x => /^Skip\\s*[\\u2010-\\u2015-]?\\s*No evidence/i.test(x.innerText.trim())); b.click(); return 1; })()`); await sleep(900); }
    const noBtn = await waitUntil(async () => (await ev(`Array.from(document.querySelectorAll('button')).some(b => b.innerText.trim() === 'No')`)), 12000);
    if (noBtn) { await clickBtn('No'); await sleep(900); }
    return await waitUntil(async () => await has('When did this happen?'), 15000);
  };

  const submitFromReview = async (_tag) => {
    if (!(await waitUntil(async () => await has('Continue to Safety Review'), 20000))) return false;
    await clickBtn('Continue to Safety Review');
    await waitUntil(async () => (await ev(`Array.from(document.querySelectorAll('button')).some(b => b.innerText.trim().startsWith('Photos and videos do not show'))`)), 15000);
    await clickMatch('^Photos and videos do not show'); await sleep(300);
    await clickMatch('^This report is true'); await sleep(300);
    await clickMatch('^I understand the evidence'); await sleep(500);
    await clickBtn('Submit Report');
    return await waitUntil(async () => (await has('See what the city is reporting')) || (await has('Similar issue nearby')), 30000);
  };

  const firstIncident = async () => {
    const raw = await ev(`(() => { const arr = JSON.parse(localStorage.getItem('ns_incidents') || '[]'); return JSON.stringify(arr[0] || null); })()`);
    try { return raw && raw !== 'EXC' ? JSON.parse(raw) : null; } catch { return null; }
  };

  const finish = () => {
    const pass = results.filter(r => r[1]).length;
    const relevant = consoleErrors.filter(e => !/favicon|ResizeObserver|Download the React DevTools/i.test(e));
    const summary = results.map(([n, ok]) => (ok ? 'PASS ' : 'FAIL ') + n).join('\n')
      + `\n\n${pass}/${results.length} checks passed`
      + (relevant.length ? '\n\nConsole errors:\n' + relevant.slice(0, 12).map(e => '  ' + e.slice(0, 240)).join('\n') : '');
    writeFileSync(RESULTS, summary);
    try { ws.close(); } catch {}
    process.exit(pass === results.length ? 0 : 1);
  };

  const runAdminChecks = async () => {
    await send('Page.navigate', { url: 'http://localhost:3100/admin/login' }); await sleep(3500);
    await setInput('input[type="password"]', 'nammasamasye2024'); await sleep(300);
    await ev(`(() => { const b = document.querySelector('button[type=submit]'); if (b) { b.click(); return 1; } return 0; })()`);
    await waitUntil(async () => (await ev('location.pathname')) === '/admin/dashboard', 12000);
    await send('Page.navigate', { url: 'http://localhost:3100/admin/reports' }); await sleep(4500);
    const v = await ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim() === 'View'); if (b) { b.click(); return 'CLICKED'; } return 'NOT_FOUND'; })()`);
    await waitUntil(async () => (await text()).includes('Incident Details'), 15000);
    const adm = await text();
    check('D1 admin detail opened', v === 'CLICKED' && adm.includes('Incident Details'));
    check('D2 admin shows incident happened', adm.includes('Incident happened:'));
    check('D3 admin EXACT badge', adm.includes('EXACT'));
    check('D4 admin shows reported-at separately', adm.includes('Created (reported at):'));
    check('D5 admin shows incident clock time', adm.includes('18:30'));
  };

  const phase = process.argv[2] || 'A';

  if (phase === 'D') {
    await runAdminChecks();
    finish();
  }

  if (phase === 'A') {
    // ---------- Scenario A: prefill "yesterday" → specific date+time → EXACT ----------
    await reset('A');
    check('A1 category button', (await clickBtn('Illegal Parking')) === 'CLICKED');
    check('A2 reached when step', await walkToWhen('A', 'streetlight pole fell down yesterday evening near the market road'));
    const aY = await chipClass('Yesterday');
    check('A3 yesterday prefilled', typeof aY === 'string' && aY.includes('bg-primary'));
    check('A4 prefill hint shown', await has('Guessed from your description'));
    check('A5 input area hidden on when step', (await inputReady()) === false);
    check('A6 pick specific', (await clickMatch('^Pick date & time$')) === 'CLICKED');
    await sleep(600);
    check('A7 calendar shown', await waitUntil(async () => (await ev(`!!document.querySelector('input[type="date"]')`)) === true, 5000));
    check('A8 date set', (await setInput('input[type="date"]', '2026-10-05')) === 'OK');
    await sleep(300);
    check('A9 time set', (await setInput('input[type="time"]', '18:30')) === 'OK');
    await sleep(400);
    check('A10 continue enabled', (await continueDisabled()) === 'false');
    check('A11 continue clicked', (await clickMatch('^Continue$')) === 'CLICKED');
    check('A12 at review', await waitUntil(async () => await has('When:'), 8000));
    const aReview = await text();
    check('A13 review shows 18:30', aReview.includes('18:30'));
    check('A14 submitted', await submitFromReview('A'));
    const aInc = await firstIncident();
    check('A15 stored incident_date', !!aInc && aInc.incident_date === '2026-10-05');
    check('A16 stored incident_time', !!aInc && aInc.incident_time === '18:30');
    check('A17 stored precision EXACT', !!aInc && aInc.incident_time_precision === 'EXACT');
    check('A18 stored incident_date_time', !!aInc && !!aInc.incident_date_time);
    check('A19 incident time != report time', !!aInc && !!aInc.date_of_incident && !!aInc.created_at && aInc.date_of_incident !== aInc.created_at);
    finish();
  }

  if (phase === 'BC') {
    // ---------- Scenario B: emergency text → ONGOING prefill ----------
    await reset('B');
    check('B1 category button', (await clickBtn('Illegal Parking')) === 'CLICKED');
    check('B2 reached when step', await walkToWhen('B', 'someone is attacking me right now near the metro gate'));
    const bR = await chipClass('Happening right now');
    check('B3 right-now prefilled', typeof bR === 'string' && bR.includes('bg-red-600'));
    check('B4 continue clicked', (await clickMatch('^Continue$')) === 'CLICKED');
    check('B5 review shows ongoing', await waitUntil(async () => (await text()).includes('Happening right now'), 8000));
    check('B6 submitted', await submitFromReview('B'));
    const bInc = await firstIncident();
    check('B7 stored precision ONGOING', !!bInc && bInc.incident_time_precision === 'ONGOING');
    check('B8 stored date_of_incident', !!bInc && !!bInc.date_of_incident);

    // ---------- Scenario C: no clue → disabled Continue → UNKNOWN ----------
    await reset('C');
    check('C1 category button', (await clickBtn('Illegal Parking')) === 'CLICKED');
    check('C2 reached when step', await walkToWhen('C', 'the drainage water is stagnating on the road since a long time'));
    check('C3 continue disabled without choice', (await continueDisabled()) === 'true');
    check('C4 unknown picked', (await clickMatch("^I'm not sure$")) === 'CLICKED');
    check('C5 continue enabled after choice', (await continueDisabled()) === 'false');
    check('C6 continue clicked', (await clickMatch('^Continue$')) === 'CLICKED');
    check('C7 review shows not sure', await waitUntil(async () => (await text()).includes("I'm not sure"), 8000));
    check('C8 submitted', await submitFromReview('C'));
    const cInc = await firstIncident();
    check('C9 stored precision UNKNOWN', !!cInc && cInc.incident_time_precision === 'UNKNOWN');
    finish();
  }

  writeFileSync(RESULTS, 'unknown phase: ' + phase);
  process.exit(2);
}

main().catch(e => {
  const msg = 'FATAL ' + (e && e.stack ? e.stack : String(e));
  try { writeFileSync(RESULTS, msg); } catch {}
  process.exit(2);
});
