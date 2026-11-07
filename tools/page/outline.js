// Print a DOM subtree with rect, colour and background of every element.
// Args (globalThis.__args): [selector, maxDepth, maxChildrenPerNode]
(() => {
  const [sel, maxDepth, maxKids] = globalThis.__args || ['body', 6, 6];
  const root = document.querySelector(sel);
  if (!root) return 'no element matches ' + sel;
  const skip = new Set(['path', 'polygon', 'polyline', 'circle', 'rect', 'g', 'line', 'defs', 'clippath', 'mask', 'stop', 'lineargradient', 'radialgradient', 'ellipse']);
  const lines = [];
  const walk = (el, d) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const tag = el.tagName.toLowerCase();
    if (skip.has(tag)) return;
    const r = el.getBoundingClientRect();
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 30);
    const cls = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
    const bg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? ' bg=' + cs.backgroundColor : '';
    const bi = cs.backgroundImage !== 'none' ? ' bi=' + cs.backgroundImage.slice(0, 50) : '';
    lines.push('  '.repeat(d) + tag + (cls.trim() ? '.' + cls.trim().split(/\s+/).join('.') : '') +
      ` [${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}] c=${cs.color}${bg}${bi}` +
      (own ? ` "${own}"` : ''));
    if (d >= maxDepth) return;
    const kids = [...el.children];
    kids.slice(0, maxKids).forEach((k) => walk(k, d + 1));
    if (kids.length > maxKids) lines.push('  '.repeat(d + 1) + `... +${kids.length - maxKids} more`);
  };
  walk(root, 0);
  return lines.join('\n');
})()
