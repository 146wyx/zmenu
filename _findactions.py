import sys, os

ROOT = os.path.dirname(os.path.abspath(__file__))
f = os.path.join(ROOT, 'editor-assets', 'zmenu-editor.js')

with open(f, 'rb') as fh:
    data = fh.read()

print('bytes', len(data), 'first hex', data[:5].hex())

text = data.decode('utf-8')
print('text len', len(text))

for mk in ['Actions (', '选择操作类型', '添加操作', 'MESSAGE', 'name:"MESSAGE"']:
    idx = text.find(mk)
    print(f"find {mk!r}: {idx}")

# Dump context around each hit
markers = ['Actions (', '选择操作类型', '添加操作']
out = []
for mk in markers:
    p = 0
    hits = 0
    while hits < 3:
        idx = text.find(mk, p)
        if idx < 0:
            break
        hits += 1
        s = max(0, idx - 600)
        e = min(len(text), idx + 2200)
        out.append(f"===== {mk!r} at {idx} =====")
        out.append(text[s:e])
        out.append("----")
        p = idx + len(mk)

outpath = os.path.join(ROOT, '_findactions_out.txt')
with open(outpath, 'w', encoding='utf-8') as fh:
    fh.write("\n".join(out))
print('wrote', len(out), 'blocks to', outpath)
