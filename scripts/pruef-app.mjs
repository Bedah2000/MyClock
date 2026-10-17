/* Prüffunktionen, die im Rahmen der App laufen (Chromium und WebKit). */
export const IM_APP = () => {
  window.__pruef = {
    sichtbar(el) {
      if (!el || el.closest('#ablage')) return false;
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || e.hidden) return false; }
      const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
    },
    layout() {
      const S = this, p = [], W = innerWidth, H = innerHeight, se = document.scrollingElement;
      if (se.scrollHeight > se.clientHeight + 1 || se.scrollWidth > se.clientWidth + 1) p.push(`Seite scrollt (${se.scrollWidth}×${se.scrollHeight})`);
      for (const c of document.querySelectorAll('.spalte,#dock,.blatt,#kopf,.entsperren')) {
        if (!S.sichtbar(c)) continue; const r = c.getBoundingClientRect();
        for (const b of c.querySelectorAll('.block,button,.ezeile,p')) {
          if (!S.sichtbar(b)) continue; const q = b.getBoundingClientRect();
          if (q.bottom > r.bottom + 1.5 || q.right > r.right + 1.5 || q.left < r.left - 1.5 || q.top < r.top - 1.5) p.push(`${c.id}: ${b.id || b.className || b.tagName} ragt heraus`);
        }
      }
      for (const sp of document.querySelectorAll('.spalte')) {
        if (!S.sichtbar(sp)) continue;
        const o = [...sp.querySelector('.oben').children].filter(e => S.sichtbar(e)), u = [...sp.querySelector('.unten').children].filter(e => S.sichtbar(e));
        if (o.length && u.length && o[o.length - 1].getBoundingClientRect().bottom > u[0].getBoundingClientRect().top + 1) p.push(`${sp.id}: oben und unten überlappen`);
      }
      for (const b of document.querySelectorAll('button')) {
        if (!S.sichtbar(b)) continue;
        if (b.scrollWidth > b.clientWidth + 2 || b.scrollHeight > b.clientHeight + 2) p.push(`Text abgeschnitten: „${b.textContent.trim()}“`);
        const r = b.getBoundingClientRect(); if (r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1) p.push(`außerhalb: „${b.textContent.trim()}“`);
      }
      return p;
    },
    groessen(profil) {
      // Mindestmaße nach Rückmeldung der Lehrkraft (kompaktere Bedienung): Tafel 60 px / Text 20 px / Antworten 40 px, Tablet 44 pt / 15 px / 22 px
      const S = this, p = [], minT = profil === 'tafel' ? 60 : 44, minF = profil === 'tafel' ? 20 : 15, minA = profil === 'tafel' ? 40 : 22;
      for (const b of document.querySelectorAll('button,[role=slider]#jahr')) {
        if (!S.sichtbar(b)) continue; const r = b instanceof HTMLElement ? { width: b.offsetWidth, height: b.offsetHeight } : b.getBoundingClientRect();
        if (Math.min(r.width, r.height) < minT - .5) p.push(`Tippfläche ${Math.round(r.width)}×${Math.round(r.height)}: „${b.textContent.trim().slice(0, 24)}“`);
      }
      const walker = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) {
        if (!n.textContent.trim()) continue; const el = n.parentElement;
        if (el.closest('#uhr,symbol,.sprite') || !S.sichtbar(el) || el.closest('.unsichtbar') || el.getBoundingClientRect().width <= 1) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (el.closest('#band,#jahr')) { if (fs * (el.ownerSVGElement.getBoundingClientRect().width / el.ownerSVGElement.viewBox.baseVal.width) < minF - .5) p.push(`Bandtext ${fs}px: „${n.textContent.trim()}“`); continue; }
        if (fs < minF - .5) p.push(`Text ${fs}px: „${n.textContent.trim().slice(0, 30)}“`);
      }
      for (const a of document.querySelectorAll('.antwort')) if (S.sichtbar(a) && parseFloat(getComputedStyle(a).fontSize) < minA - .5) p.push(`Antworttext ${getComputedStyle(a).fontSize}`);
      return p;
    },
    reichweite() {
      const S = this, p = [], grenze = innerHeight / 3;
      for (const b of document.querySelectorAll('.spalte button,#jahr')) {
        if (!S.sichtbar(b) || b.closest('.blatt,.entsperren,#kopf,[data-lehrkraft]')) continue;
        const r = b.getBoundingClientRect(); if (r.top < grenze - .5) p.push(`„${b.textContent.trim().slice(0, 24)}“ bei y=${Math.round(r.top)}`);
      }
      return p;
    },
    uhr() { const r = document.getElementById('uhr').getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10).join(','); },
    zifferblatt(profil) {
      // Ziffernhöhe in px (gemessen mit Canvas an der tatsächlichen Schrift), Anteil des Zifferblatts an der Höhe
      const svg = document.getElementById('uhr'), r = svg.getBoundingClientRect(), s = r.width / 234, K = LU.uhr.K, out = {};
      const hoehe = (sel, faktor) => { const t = document.querySelector(sel); if (!t) return 0; const m = this.tinte(t); return +((m.y1 - m.y0) * faktor * s).toFixed(1); };
      out.stundenzahlen = hoehe('#stundenzahlen text:nth-child(3)', K); out.minutenzahlen = hoehe('#minutenzahlen text:nth-child(4)', 1); out.alleMinuten = hoehe('#alleminuten text:nth-child(8)', 1);
      out.minutenVorher = +(11.5 * .789 * s).toFixed(1); // alte Minutenzahlen: Schriftgröße 11,5, Ziffernhöhe 0,789 em
      out.anteilHoehe = Math.round(r.height / innerHeight * 100); out.zifferblattAnteil = Math.round(r.height * 200 * K / 234 / innerHeight * 100);
      return out;
    },
    // Tintenrahmen einer SVG-Zahl in Einheiten des viewBox ihrer Gruppe (Canvas misst die Glyphen, textLength wird berücksichtigt)
    tinte(t) {
      const c = this._c || (this._c = document.createElement('canvas').getContext('2d'));
      const fs = +t.getAttribute('font-size'), fam = getComputedStyle(t).fontFamily, txt = t.textContent;
      c.font = `${fs * 10}px ${fam}`; const m = c.measureText(txt), w = m.width / 10;
      const tl = t.getAttribute('textLength'), k = tl ? +tl / w : 1, x = +t.getAttribute('x'), y = +t.getAttribute('y'), start = x - w * k / 2;
      return { x0: start - m.actualBoundingBoxLeft / 10 * k, x1: start + m.actualBoundingBoxRight / 10 * k, y0: y - m.actualBoundingBoxAscent / 10, y1: y + m.actualBoundingBoxDescent / 10 };
    },
    // Minutenzahlen: Glyphen pixelgenau gerastert (4 px je Einheit), mit Sicherheitsrand. Keine Zahl berührt eine andere, alle liegen
    // im Minutenring, mittig (Tintenmitte höchstens 0,8 Einheiten neben der Ringmitte) und ungestaucht.
    minutenring(rand = .25) {
      const p = [], K = LU.uhr.K, rin = 100 * K + .9 * K, rout = 116.4 - .6, S = 4, N = 234 * S;
      const cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d', { willReadFrequently: true });
      for (const id of ['minutenzahlen', 'alleminuten']) {
        const besetzt = new Int16Array(N * N).fill(-1), ts = [...document.querySelectorAll(`#${id} text`)];
        ts.forEach((t, i) => {
          const b = this.tinte(t), fs = +t.getAttribute('font-size'), fam = getComputedStyle(t).fontFamily;
          c.clearRect(0, 0, N, N); c.save(); c.font = `${fs * S}px ${fam}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
          const w = c.measureText(t.textContent).width / S, tl = t.getAttribute('textLength'), k = tl ? +tl / w : 1, x = +t.getAttribute('x'), y = +t.getAttribute('y');
          c.translate((x + 117) * S, (y + 117) * S); c.scale(k, 1); c.fillText(t.textContent, 0, 0);
          if (rand > 0) { c.lineWidth = 2 * rand * S; c.lineJoin = 'round'; c.strokeText(t.textContent, 0, 0); } c.restore();
          const x0 = Math.max(0, Math.floor((b.x0 + 116) * S)), y0 = Math.max(0, Math.floor((b.y0 + 116) * S)), x1 = Math.min(N, Math.ceil((b.x1 + 118) * S)), y1 = Math.min(N, Math.ceil((b.y1 + 118) * S));
          const d = c.getImageData(x0, y0, x1 - x0, y1 - y0).data; let ring = true, wen = -1;
          for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
            if (d[((yy - y0) * (x1 - x0) + xx - x0) * 4 + 3] < 96) continue;
            const r = Math.hypot(xx / S - 117, yy / S - 117); if (r < rin || r > rout) ring = false;
            const o = besetzt[yy * N + xx]; if (o >= 0 && o !== i) wen = o; besetzt[yy * N + xx] = i;
          }
          if (!ring) p.push(`${id}: ${t.textContent} ragt aus dem Ring`);
          if (wen >= 0) p.push(`${id}: ${t.textContent} berührt ${ts[wen].textContent}`);
          if (Math.abs(Math.hypot((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2) - LU.uhr.RING.mitte) > .8) p.push(`${id}: ${t.textContent} nicht mittig im Ring`);
          if (t.hasAttribute('textLength')) p.push(`${id}: ${t.textContent} gestaucht`);
        });
      }
      return p;
    }
  };
};
