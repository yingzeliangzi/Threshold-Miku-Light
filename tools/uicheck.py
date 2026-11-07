"""Look at a live Steam window and find readability problems.

  python uicheck.py contrast <window> [threshold]   text whose contrast with what is
                                                    really behind it (from a screenshot)
                                                    is below threshold (default 3.0)
  python uicheck.py dark <window>                   elements painting a dark background
  python uicheck.py outline <window> <selector> [depth] [kids]
                                                    DOM tree with colours and backgrounds

<window> is a regex on the window title: '^Steam$' (main window),
'フレンドリスト' or 'Friends List', 'Steam設定' or 'Steam Settings', 'Root Menu$' ...
Run "node cdp.mjs list" for all titles. The window must be visible (not minimised).

Hashed classes in the output are shown as ReadableName{hash-prefix}; this needs
classmap.json from "python steamclass.py export". "contrast" needs Pillow
(pip install pillow).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
OUT = TOOLS / 'out'
sys.stdout.reconfigure(encoding='utf-8')

try:
    CMAP = json.loads((TOOLS / 'classmap.json').read_text(encoding='utf-8'))['map']
except FileNotFoundError:
    CMAP = {}


def cdp(*args):
    r = subprocess.run(['node', str(TOOLS / 'cdp.mjs'), *args], capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        sys.exit(r.stderr.strip() or r.stdout.strip())
    return r.stdout


def name(cls):
    n = CMAP.get(cls)
    return f"{n[0].split('.', 1)[1]}{{{cls[:6]}}}" if n else cls


def readable(text):
    return re.sub(r'(?<=\.)([_a-zA-Z0-9-]{16,32})(?=[.\s\[<]|$)', lambda mo: name(mo.group(1)), text)


def luminance(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])


def ratio(a, b):
    la, lb = sorted([luminance(a), luminance(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def parse_color(col):
    nums = [float(x) for x in re.findall(r'[\d.]+', col)]
    return tuple(nums[:3]), (nums[3] if len(nums) > 3 else 1.0)


def cmd_contrast(window, threshold=3.0):
    from PIL import Image
    OUT.mkdir(exist_ok=True)
    scan = json.loads(cdp(window, 'evalfile', str(TOOLS / 'page' / 'scan.js')))
    shot = OUT / 'contrast.png'
    cdp(window, 'shot', str(shot))
    im = Image.open(shot).convert('RGB')
    dpr = scan['dpr']
    rows = []
    for it in scan['items']:
        box = [int(it['x'] * dpr), int(it['y'] * dpr), int((it['x'] + it['w']) * dpr), int((it['y'] + it['h']) * dpr)]
        box = [max(0, box[0]), max(0, box[1]), min(im.width, box[2]), min(im.height, box[3])]
        if box[2] - box[0] < 2 or box[3] - box[1] < 2:
            continue
        fg, alpha = parse_color(it['color'])
        alpha *= it['op']
        px = list(im.crop(box).getdata())
        # the background is what is left after dropping the pixels closest to the text colour
        px.sort(key=lambda p: -sum((p[i] - fg[i]) ** 2 for i in range(3)))
        bgpx = px[: max(1, len(px) * 6 // 10)]
        bg = tuple(sorted(p[i] for p in bgpx)[len(bgpx) // 2] for i in range(3))
        eff = tuple(fg[i] * alpha + bg[i] * (1 - alpha) for i in range(3))
        cr = ratio(eff, bg)
        if cr < threshold:
            rows.append((cr, it, bg))
    rows.sort(key=lambda r: r[0])
    print(f'{len(rows)} of {len(scan["items"])} text items below {threshold}:1  (screenshot: {shot})')
    for cr, it, bg in rows:
        print(f'{cr:4.2f}  "{it["t"]}"  text={it["color"]} behind=rgb{bg}  at ({int(it["x"])},{int(it["y"])})')
        print('      ' + ' < '.join(readable(c) for c in it['chain'][:3]))


def cmd_dark(window):
    items = json.loads(cdp(window, 'evalfile', str(TOOLS / 'page' / 'bgscan.js')))
    for it in items:
        nums = [float(x) for x in re.findall(r'[\d.]+', it['bc'])]
        a = nums[3] if len(nums) > 3 else 1
        lum = (0.2126 * nums[0] + 0.7152 * nums[1] + 0.0722 * nums[2]) / 255
        dark = (a >= 0.25 and lum < 0.45) or ('gradient' in it['bi'] and 'rgb' in it['bi'])
        if not dark:
            continue
        cls = '.'.join(name(c) for c in it['cls'])
        print(f"{it['tag']}.{cls}  [{it['x']},{it['y']} {it['w']}x{it['h']}]  bg={it['bc']} {it['bi']}")


def cmd_outline(window, selector, depth='6', kids='6'):
    args = json.dumps([selector, int(depth), int(kids)])
    print(readable(cdp(window, 'evalfile', str(TOOLS / 'page' / 'outline.js'), args)))


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        print(__doc__)
        return
    if a[0] == 'contrast':
        cmd_contrast(a[1], float(a[2]) if len(a) > 2 else 3.0)
    elif a[0] == 'dark':
        cmd_dark(a[1])
    elif a[0] == 'outline' and len(a) >= 3:
        cmd_outline(*a[1:])
    else:
        print(__doc__)


if __name__ == '__main__':
    main()
