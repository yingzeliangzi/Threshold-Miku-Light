(() => {
  // Collect visible text-bearing elements with their rect and color.
  const out = [];
  const W = innerWidth, H = innerHeight;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const txt = n.textContent.trim();
    if (!txt) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const range = document.createRange();
    range.selectNodeContents(n);
    const r = range.getBoundingClientRect();
    if (r.width < 4 || r.height < 6) continue;
    if (r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    // effective opacity
    let op = 1, a = el;
    while (a && a.nodeType === 1) { op *= parseFloat(getComputedStyle(a).opacity); a = a.parentElement; }
    if (op < 0.05) continue;
    // is this point actually on top? (not covered by a modal etc.)
    const cx = Math.min(W - 1, Math.max(0, r.left + Math.min(r.width / 2, 8)));
    const cy = Math.min(H - 1, Math.max(0, r.top + r.height / 2));
    const top = document.elementFromPoint(cx, cy);
    if (top && top !== el && !el.contains(top) && !top.contains(el)) continue;
    const chain = [];
    let p = el;
    for (let i = 0; i < 4 && p && p !== document.body; i++, p = p.parentElement) {
      chain.push(p.tagName.toLowerCase() + (p.classList.length ? '.' + [...p.classList].join('.') : ''));
    }
    out.push({
      t: txt.slice(0, 40), x: r.left, y: r.top, w: r.width, h: r.height,
      color: cs.color, fs: parseFloat(cs.fontSize), fw: cs.fontWeight, op, chain,
      ts: cs.textShadow !== 'none',
    });
  }
  return JSON.stringify({ dpr: devicePixelRatio, W, H, items: out });
})()
