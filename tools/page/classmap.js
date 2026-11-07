(() => {
  // Collect every CSS-module export object from Steam's webpack runtime.
  let req;
  window.webpackChunksteamui.push([[Symbol('cm')], {}, (r) => { req = r; }]);
  const out = {}; // hash -> [moduleId, key]
  const mods = {}; // moduleId -> {key: hash}
  const isHash = (v) => typeof v === 'string' && v.split(' ').every((c) => /^[_a-zA-Z0-9-]{16,32}$/.test(c) && /[A-Z]/.test(c) && /[a-z]/.test(c));
  for (const id of Object.keys(req.m)) {
    let ex;
    try { ex = req(id); } catch (e) { continue; }
    if (!ex || typeof ex !== 'object') continue;
    const cands = [ex, ex.default].filter((o) => o && typeof o === 'object');
    for (const o of cands) {
      let keys;
      try { keys = Object.keys(o); } catch (e) { continue; }
      if (keys.length < 2 || keys.length > 800) continue;
      let ok = 0;
      for (const k of keys) { try { if (isHash(o[k]) && o[k] !== k) ok++; } catch (e) {} }
      if (ok < 2) continue; // some modules also export breakpoints like "600px"
      mods[id] = {};
      for (const k of keys) {
        const v = o[k];
        if (!isHash(v)) continue;
        for (const cls of v.split(' ')) {
          (out[cls] ||= []).push(id + '.' + k);
        }
        mods[id][k] = v;
      }
    }
  }
  return JSON.stringify({ count: Object.keys(out).length, modules: Object.keys(mods).length, map: out, mods });
})()
