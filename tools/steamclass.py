"""Steam hashed class name helper for this skin.

Steam builds its UI with CSS modules, so a class such as `Container` in the
library sidebar ships as `_3x1HklzyDs4TEjACrRO2tB`. The readable names are
still in Steam's JavaScript, and this tool reads them out of the running
client (through CEF remote debugging) so the skin can be maintained.

  python steamclass.py export              read the class table from Steam -> classmap.json
  python steamclass.py hash <hash> ...     hashed class -> readable name(s)
  python steamclass.py name <Name> [pre]   readable name -> hashed class(es) (optional hash prefix)
  python steamclass.py check               list hashed classes in the skin that Steam no longer has
  python steamclass.py snapshot            remember what every class used by the skin is called
  python steamclass.py migrate [--write]   after a Steam update: map dead classes to their new hash

Typical update flow after Steam changes its UI:
  python steamclass.py export
  python steamclass.py check
  python steamclass.py migrate            (review the proposed replacements)
  python steamclass.py migrate --write    (apply them to css/ and js/)
  python steamclass.py snapshot           (record the new state)
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
SKIN = TOOLS.parent
MAP_FILE = TOOLS / 'classmap.json'
SNAP_FILE = TOOLS / 'selectors.snapshot.json'
SKIN_FILES = sorted([*SKIN.glob('*.css'), *(SKIN / 'css').glob('*.css'), *(SKIN / 'js').glob('*.js')])

sys.stdout.reconfigure(encoding='utf-8')


def load_map():
    if not MAP_FILE.exists():
        sys.exit('classmap.json not found - run "python steamclass.py export" with Steam running first.')
    return json.loads(MAP_FILE.read_text(encoding='utf-8'))


def strip_comments(text):
    return re.sub(r'/\*.*?\*/', '', text, flags=re.S)


def looks_hashed(token, known):
    if token in known:
        return True
    return bool(re.search(r'\d', token) and re.search(r'[A-Z]', token) and re.search(r'[a-z]', token))


def skin_hashes(known):
    """Return {hash: [files]} for hashed-looking class names used in the skin."""
    found = {}
    for f in SKIN_FILES:
        text = strip_comments(f.read_text(encoding='utf-8'))
        if f.suffix == '.css':
            tokens = re.findall(r'\.([_a-zA-Z0-9-]{16,32})(?![\w-])', text)
        else:
            tokens = re.findall(r"['\".\s]([_a-zA-Z0-9-]{16,32})(?![\w-])", text)
        for tok in tokens:
            if looks_hashed(tok, known):
                found.setdefault(tok, set()).add(f.relative_to(SKIN).as_posix())
    return {k: sorted(v) for k, v in sorted(found.items())}


def readable(names):
    return ', '.join(n.split('.', 1)[1] for n in names)


def cmd_export():
    out = subprocess.run(['node', str(TOOLS / 'cdp.mjs'), 'SharedJSContext', 'evalfile', str(TOOLS / 'page' / 'classmap.js')],
                         capture_output=True, text=True, encoding='utf-8')
    if out.returncode != 0 or not out.stdout.lstrip().startswith('{'):
        sys.exit(out.stderr or out.stdout)
    data = json.loads(out.stdout)
    MAP_FILE.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    print(f"saved {MAP_FILE.name}: {data['count']} classes from {data['modules']} modules")


def cmd_hash(args):
    m = load_map()['map']
    for h in args:
        h = h.lstrip('.')
        print(f'{h}  ->  {readable(m[h]) if h in m else "(not in current Steam)"}')


def cmd_name(args):
    d = load_map()
    name, prefix = args[0], (args[1] if len(args) > 1 else '')
    for mid, keys in d['mods'].items():
        v = keys.get(name)
        if v and v.startswith(prefix):
            siblings = ', '.join(k for k in list(keys)[:8] if k != name)
            print(f'{name}: {v}    (module {mid}: {siblings} ...)')


def cmd_check():
    m = load_map()['map']
    used = skin_hashes(m)
    dead = {h: f for h, f in used.items() if h not in m}
    print(f'{len(used)} hashed classes used by the skin, {len(used) - len(dead)} still exist in Steam, {len(dead)} missing.')
    for h, files in dead.items():
        print(f'  missing  {h}   in {", ".join(files)}')
    if dead:
        print('\nSome may only exist on pages not opened yet in this Steam session (Steam loads UI code lazily);'
              '\nopen those pages, run "export" again, then "migrate".')


def load_snapshot():
    if not SNAP_FILE.exists():
        return {'modules': {}, 'classes': {}}
    return json.loads(SNAP_FILE.read_text(encoding='utf-8'))


def save_snapshot(snap, used):
    snap['classes'] = {h: v for h, v in sorted(snap['classes'].items()) if h in used}
    live = {v[1] for v in snap['classes'].values()}
    snap['modules'] = {k: v for k, v in sorted(snap['modules'].items()) if k in live}
    SNAP_FILE.write_text(json.dumps(snap, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


def cmd_snapshot():
    """For every class the skin uses, remember its readable name and the
    names of the other classes in the same Steam module (used to find the
    same module again after Steam renames everything)."""
    d = load_map()
    m, mods = d['map'], d['mods']
    snap = load_snapshot()
    used = skin_hashes(m)
    for h in used:
        if h not in m:
            continue  # keep whatever an older snapshot knew about it
        mid, key = m[h][0].split('.', 1)
        keys = sorted(mods[mid].keys())
        sig = hashlib.sha1('|'.join(keys).encode()).hexdigest()[:10]
        snap['modules'][sig] = keys
        snap['classes'][h] = [key, sig]
    save_snapshot(snap, used)
    print(f"snapshot of {len(snap['classes'])} classes ({len(snap['modules'])} modules) saved to {SNAP_FILE.name}")


def cmd_migrate(args):
    write = '--write' in args
    d = load_map()
    m, mods = d['map'], d['mods']
    if not SNAP_FILE.exists():
        sys.exit('selectors.snapshot.json not found - it must be made with "snapshot" before Steam updates.')
    snap = load_snapshot()
    used = skin_hashes(m)
    plan = {}
    for h in used:
        if h in m:
            continue
        entry = snap['classes'].get(h)
        if not entry:
            print(f'  ?  {h}: not in the snapshot, look it up by hand')
            continue
        key, sig = entry
        old = set(snap['modules'][sig])
        best, best_score = None, 0.0
        for keys in mods.values():
            if key not in keys:
                continue
            new = set(keys)
            score = len(old & new) / len(old | new)
            if score > best_score:
                best, best_score = keys[key].split(' ')[0], score
        if best and best_score >= 0.5:
            plan[h] = best
            print(f'  {h} -> {best}   ({key}, module match {best_score:.0%})')
        else:
            print(f'  ?  {h} ({key}): no confident match')
    if not plan:
        print('nothing to migrate')
        return
    if not write:
        print(f'\n{len(plan)} replacement(s) proposed. Run with --write to apply.')
        return
    for f in SKIN_FILES:
        text = f.read_text(encoding='utf-8')
        new_text = text
        for old_h, new_h in plan.items():
            new_text = re.sub(r'(?<![\w-])' + re.escape(old_h) + r'(?![\w-])', new_h, new_text)
        if new_text != text:
            f.write_text(new_text, encoding='utf-8', newline='\n')
            print('updated', f.relative_to(SKIN).as_posix())
    for old_h, new_h in plan.items():
        snap['classes'][new_h] = snap['classes'][old_h]
    save_snapshot(snap, skin_hashes(m))


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ('-h', '--help', 'help'):
        print(__doc__)
        return
    cmd, args = sys.argv[1], sys.argv[2:]
    {
        'export': lambda: cmd_export(),
        'hash': lambda: cmd_hash(args),
        'name': lambda: cmd_name(args),
        'check': lambda: cmd_check(),
        'snapshot': lambda: cmd_snapshot(),
        'migrate': lambda: cmd_migrate(args),
    }.get(cmd, lambda: print(__doc__))()


if __name__ == '__main__':
    main()
