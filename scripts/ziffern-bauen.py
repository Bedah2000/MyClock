# Baut die Ziffernschrift der Uhr: Atkinson Hyperlegible Next (SIL OFL 1.1), nur die Ziffern 0-9,
# in zwei Stärken (Regular für Text, SemiBold für das Zifferblatt).
# Abänderung: Die Null bekommt einen ungeteilten Innenraum (ohne Schrägstrich), weil eine durchgestrichene Null
# auf der Lernuhr verwirrt. Quelle: npm pack @fontsource/atkinson-hyperlegible-next@5.3.0
#   python3 -m pip install fonttools brotli
#   python3 scripts/ziffern-bauen.py package/files/atkinson-hyperlegible-next-latin-400-normal.woff src/assets/ziffern-atkinson-400.woff2
#   python3 scripts/ziffern-bauen.py package/files/atkinson-hyperlegible-next-latin-600-normal.woff src/assets/ziffern-atkinson-600.woff2
import sys
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.transformPen import TransformPen
src, out = sys.argv[1], sys.argv[2]
f = TTFont(src)
o = Options(); o.layout_features = []; o.name_IDs = ['*']; o.hinting = False; o.desubroutinize = True; o.flavor = 'woff2'
s = Subsetter(o); s.populate(unicodes=range(0x30, 0x3A)); s.subset(f)
gs = f.getGlyphSet(); rec = RecordingPen(); gs['zero'].draw(rec)
kont = []; cur = []
for op, args in rec.value:
    cur.append((op, args))
    if op in ('closePath', 'endPath'): kont.append(cur); cur = []
pts = lambda c: [a for _, args in c for a in args]
def bbox(c): xs = [x for x, _ in pts(c)]; ys = [y for _, y in pts(c)]; return min(xs), min(ys), max(xs), max(ys)
aussen = max(kont, key=lambda c: (bbox(c)[2] - bbox(c)[0]) * (bbox(c)[3] - bbox(c)[1]))
innen = [c for c in kont if c is not aussen]
ax0, ay0, ax1, ay1 = bbox(aussen)
ix0 = min(bbox(c)[0] for c in innen); iy0 = min(bbox(c)[1] for c in innen); ix1 = max(bbox(c)[2] for c in innen); iy1 = max(bbox(c)[3] for c in innen)
cx, cy = (ax0 + ax1) / 2, (ay0 + ay1) / 2
sx, sy = (ix1 - ix0) / (ax1 - ax0), (iy1 - iy0) / (ay1 - ay0)
icx, icy = (ix0 + ix1) / 2, (iy0 + iy1) / 2
pen = TTGlyphPen(gs)
for op, args in aussen: getattr(pen, op)(*args)
# Innenraum: Außenkontur verkleinert auf die Fläche der beiden alten Innenteile, Laufrichtung umgekehrt
tp = TransformPen(ReverseContourPen(pen), (sx, 0, 0, sy, icx - sx * cx, icy - sy * cy))
for op, args in aussen: getattr(tp, op)(*args)
f['glyf']['zero'] = pen.glyph()
f.save(out)
print('Null umgebaut: Innenraum', round(sx, 3), round(sy, 3))
