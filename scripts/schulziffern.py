# Baut die Ziffernschrift der Lernuhr aus eigenen Federstrichen: „Lernuhr Schulziffern“.
# Ziffern nach deutscher Schreibweise: offene 4, 1 mit Aufstrich ohne Fuß, 7 mit Querstrich, 9 mit gerader Unterlänge.
# Jede Ziffer ist eine Mittellinie (SVG-Pfad, y nach oben, Ziffernhöhe 700 von 1000); die Schrift entsteht, indem die
# Linien mit runden Enden in einer festen Strichstärke nachgezogen werden. Eigene Arbeit, keine fremden Schriftdaten.
#   python3 -m pip install fonttools brotli skia-pathops
#   python3 scripts/schulziffern.py            -> src/assets/schulziffern-400.woff2, schulziffern-600.woff2
import math, os, sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.basePen import BasePen
from fontTools.svgLib.path import parse_path
import pathops

ZIFFERN = {
    'zero':  ['M220 695C311 695 385 541 385 350C385 159 311 5 220 5C129 5 55 159 55 350C55 541 129 695 220 695Z'],
    'one':   ['M60 470L245 695L245 5'],
    'two':   ['M55 540C70 645 145 695 225 695C315 695 385 635 385 540C385 450 330 380 260 300L45 5L410 5'],
    'three': ['M70 610C110 670 165 695 225 695C315 695 375 640 375 560C375 470 305 410 205 410C320 410 395 340 395 220C395 90 310 5 210 5C140 5 80 35 45 95'],
    'four':  ['M200 695L55 235L430 235', 'M335 695L335 5'],
    'five':  ['M115 695L95 405C140 435 190 450 240 450C340 450 410 380 410 245C410 100 320 5 205 5C135 5 80 30 45 80', 'M115 695L385 695'],
    'six':   ['M350 665C310 688 270 695 235 695C120 695 50 545 50 345C50 140 120 5 230 5C335 5 405 90 405 205C405 325 330 405 230 405C135 405 65 335 52 245'],
    'seven': ['M50 695L410 695C330 520 250 300 170 5', 'M150 355L365 355'],
    'eight': ['M225 405C130 405 75 470 75 550C75 635 140 695 225 695C310 695 375 635 375 550C375 470 320 405 225 405C115 405 45 320 45 210C45 90 125 5 225 5C325 5 405 90 405 210C405 320 335 405 225 405Z'],
    'nine':  ['M395 530C395 630 325 695 225 695C125 695 55 630 55 530C55 430 125 360 225 360C325 360 395 430 395 530L395 5'],
}
NAMEN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
RAND = 55          # Vor- und Nachbreite
HOEHE = 720        # Tintenhöhe jeder Ziffer, gleich der Versalhöhe von Andika; Unterkante auf der Grundlinie
BREITE = 1.08      # Ziffern etwas breiter als gezeichnet
SCHRITT = 6        # Länge der Teilstücke beim Glätten der Kurven

class Linien(BasePen):
    """Zerlegt Pfade in Polylinien (Liste von Punkten, geschlossen ja/nein)."""
    def __init__(self):
        super().__init__(None); self.linien = []; self.akt = None
    def _moveTo(self, p): self.akt = [p]; self.linien.append([self.akt, False])
    def _lineTo(self, p): self.akt.append(p)
    def _curveToOne(self, a, b, c):
        p0 = self.akt[-1]; n = max(2, int(math.dist(p0, c) / SCHRITT) + 2)
        for i in range(1, n + 1):
            t = i / n; u = 1 - t
            self.akt.append((u**3*p0[0] + 3*u*u*t*a[0] + 3*u*t*t*b[0] + t**3*c[0], u**3*p0[1] + 3*u*u*t*a[1] + 3*u*t*t*b[1] + t**3*c[1]))
    def _closePath(self):
        self.linien[-1][1] = True
        if self.akt[0] != self.akt[-1]: self.akt.append(self.akt[0])
    def _endPath(self): pass

def kontur(path, punkte):
    """Kontur gegen den Uhrzeigersinn anlegen, damit sich alle Teile beim Vereinigen addieren."""
    flaeche = sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(punkte, punkte[1:] + punkte[:1]))
    if flaeche < 0: punkte = punkte[::-1]
    pen = path.getPen(); pen.moveTo(punkte[0])
    for q in punkte[1:]: pen.lineTo(q)
    pen.closePath()

def ziehe(linien, w):
    """Federstrich: Rechteck je Teilstück, Kreis je Punkt; alles vereinigt (runde Enden und Ecken)."""
    p = pathops.Path(); r = w / 2
    for pts, _ in linien:
        for a, b in zip(pts, pts[1:]):
            dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy)
            if l < 1e-6: continue
            nx, ny = -dy / l * r, dx / l * r
            kontur(p, [(a[0] + nx, a[1] + ny), (a[0] - nx, a[1] - ny), (b[0] - nx, b[1] - ny), (b[0] + nx, b[1] + ny)])
        for (x, y) in pts:
            kontur(p, [(x + r * math.cos(2 * math.pi * k / 40), y + r * math.sin(2 * math.pi * k / 40)) for k in range(40)])
    p.simplify(fix_winding=True, keep_starting_points=False, clockwise=True)
    return p

def glyphe(name, w):
    lp = Linien()
    for d in ZIFFERN[name]: parse_path(d, lp)
    # gezeichnet von y=5 bis 695; skalieren, damit die Tinte samt halber Strichstärke genau 0 bis HOEHE reicht
    k = (HOEHE - w) / 690
    linien = [([(x * k * BREITE, (y - 5) * k + w / 2) for x, y in pts], zu) for pts, zu in lp.linien]
    p = ziehe(linien, w)
    rec = []
    class Sammel(BasePen):
        def __init__(s): super().__init__(None)
        def _moveTo(s, q): rec.append(q)
        def _lineTo(s, q): rec.append(q)
        def _curveToOne(s, a, b, c): rec.extend([a, b, c])
        def _qCurveToOne(s, a, b): rec.extend([a, b])
    p.draw(Sammel())
    x0 = min(x for x, _ in rec); x1 = max(x for x, _ in rec)
    dx = RAND - x0
    tp = TTGlyphPen(None)
    class Schieben(BasePen):
        def __init__(s): super().__init__(None)
        def _moveTo(s, q): tp.moveTo((round(q[0] + dx), round(q[1])))
        def _lineTo(s, q): tp.lineTo((round(q[0] + dx), round(q[1])))
        def _closePath(s): tp.closePath()
        def _endPath(s): tp.endPath()
    p.draw(Schieben())
    return tp.glyph(), round(x1 - x0 + 2 * RAND)

def baue(w, gewicht, stil, ziel):
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(['.notdef'] + NAMEN)
    fb.setupCharacterMap({0x30 + i: n for i, n in enumerate(NAMEN)})
    glyf, hmtx = {'.notdef': TTGlyphPen(None).glyph()}, {'.notdef': (500, 0)}
    for n in NAMEN:
        g, adv = glyphe(n, w); glyf[n] = g; hmtx[n] = (adv, RAND)
    fb.setupGlyf(glyf)
    fb.setupHorizontalMetrics(hmtx)
    fb.setupHorizontalHeader(ascent=950, descent=-250)
    fb.setupNameTable({'familyName': 'Lernuhr Schulziffern', 'styleName': stil, 'copyright': 'Eigene Zeichnung für die Lernuhr',
                       'version': 'Version 1.000', 'psName': 'LernuhrSchulziffern-' + stil})
    fb.setupOS2(version=4, sTypoAscender=950, sTypoDescender=-250, sTypoLineGap=0, usWinAscent=950, usWinDescent=250,
                sxHeight=500, sCapHeight=HOEHE, usWeightClass=gewicht, fsSelection=0x40 | 0x80)
    fb.setupPost()
    fb.font.flavor = 'woff2'
    fb.save(ziel)
    print(ziel, os.path.getsize(ziel), 'Bytes')

if __name__ == '__main__':
    wurzel = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'assets')
    ziel = sys.argv[1] if len(sys.argv) > 1 else wurzel
    baue(84, 400, 'Regular', os.path.join(ziel, 'schulziffern-400.woff2'))
    baue(112, 600, 'SemiBold', os.path.join(ziel, 'schulziffern-600.woff2'))
