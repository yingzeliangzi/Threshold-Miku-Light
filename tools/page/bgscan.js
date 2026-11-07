(() => {
  // List visible elements that paint a background (color or image).
  const out = [];
  const W = innerWidth, H = innerHeight;
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 12) continue;
    if (r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const bc = cs.backgroundColor;
    const bi = cs.backgroundImage;
    const m = bc.match(/[\d.]+/g) || [];
    const a = m.length > 3 ? parseFloat(m[3]) : (m.length ? 1 : 0);
    if (a < 0.08 && bi === 'none' && cs.backdropFilter === 'none') continue;
    out.push({
      tag: el.tagName.toLowerCase(), cls: [...el.classList], id: el.id,
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      bc, bi: bi === 'none' ? '' : bi.slice(0, 70), bf: cs.backdropFilter === 'none' ? '' : cs.backdropFilter,
      color: cs.color,
    });
  }
  return JSON.stringify(out);
})()
