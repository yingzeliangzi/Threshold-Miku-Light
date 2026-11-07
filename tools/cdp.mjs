// Minimal Chrome DevTools Protocol client for Steam's CEF remote debugging.
// Needs Node 22+ (built-in WebSocket) and the file
// "Steam/.cef-enable-remote-debugging" so Steam listens on localhost:8080.
//
//   node cdp.mjs list                                  list windows (targets)
//   node cdp.mjs <title-regex> eval "<js>"             run JS, print result
//   node cdp.mjs <title-regex> evalfile <f.js> [json]  run a file; json -> globalThis.__args
//   node cdp.mjs <title-regex> shot <out.png>          screenshot (window must be visible)
//   node cdp.mjs <title-regex> reloadcss               re-fetch the skin's CSS without restarting
//   node cdp.mjs <title-regex> click x,y | hover x,y   mouse input (CSS pixels)
//
// <title-regex> matches the window title, e.g. '^Steam$', 'SharedJSContext',
// 'フレンドリスト' / 'Friends List', 'Root Menu$'.
import fs from 'node:fs';

const [, , target, cmd, arg, arg2] = process.argv;
const PORT = process.env.CDP_PORT || '8080';

let list;
try {
  list = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
} catch (e) {
  console.error(`Cannot reach Steam on localhost:${PORT}. Is CEF remote debugging enabled and Steam running?`);
  process.exit(1);
}

if (!target || target === 'list') {
  for (const t of list) console.log(`${t.id.slice(0, 8)}  ${t.title}`);
  process.exit(0);
}

const re = new RegExp(target);
const t = list.find((x) => re.test(x.title) || x.id.startsWith(target));
if (!t) {
  console.error('No window matches', target, '- run "node cdp.mjs list"');
  process.exit(1);
}

const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
});
await new Promise((r) => (ws.onopen = r));
setTimeout(() => {
  console.error('TIMEOUT (a hidden or minimised window cannot be screenshotted)');
  process.exit(2);
}, parseInt(process.env.CDP_TIMEOUT || '30000', 10));

async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return 'EXCEPTION: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 2000);
  const v = r.result?.result?.value;
  return typeof v === 'string' ? v : JSON.stringify(v, null, 1);
}

if (cmd === 'eval') {
  console.log(await evaluate(arg));
} else if (cmd === 'evalfile') {
  const pre = arg2 ? `globalThis.__args = ${arg2};\n` : '';
  console.log(await evaluate(pre + fs.readFileSync(arg, 'utf8')));
} else if (cmd === 'shot') {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(arg, Buffer.from(r.result.data, 'base64'));
  console.log('saved', arg);
} else if (cmd === 'reloadcss') {
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  console.log(await evaluate(`(() => {
    const links = [...document.querySelectorAll('link[rel=stylesheet]')].filter(l => /\\/skins\\/|custom\\.css/.test(l.href));
    for (const l of links) { const n = l.cloneNode(); n.href = l.href.split('?')[0] + '?v=' + Date.now(); l.after(n); setTimeout(() => l.remove(), 400); }
    return links.length + ' stylesheet(s) reloaded';
  })()`));
  await new Promise((r) => setTimeout(r, 800));
} else if (cmd === 'click' || cmd === 'hover') {
  const [x, y] = arg.split(',').map(Number);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  if (cmd === 'click') {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }
  await new Promise((r) => setTimeout(r, 800));
} else {
  console.error('Unknown command', cmd);
}
ws.close();
process.exit(0);
