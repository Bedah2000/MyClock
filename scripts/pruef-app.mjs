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
      const S = this, p = [], minT = profil === 'tafel' ? 72 : 44, minF = profil === 'tafel' ? 28 : 20, minA = profil === 'tafel' ? 48 : 20;
      for (const b of document.querySelectorAll('button,[role=slider]#jahr')) {
        if (!S.sichtbar(b)) continue; const r = b.getBoundingClientRect();
        if (Math.min(r.width, r.height) < minT - .5) p.push(`Tippfläche ${Math.round(r.width)}×${Math.round(r.height)}: „${b.textContent.trim().slice(0, 24)}“`);
      }
      const walker = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) {
        if (!n.textContent.trim()) continue; const el = n.parentElement;
        if (el.closest('#uhr') || !S.sichtbar(el) || el.closest('.unsichtbar') || el.getBoundingClientRect().width <= 1) continue;
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
        if (!S.sichtbar(b) || b.closest('.blatt,.entsperren,#kopf')) continue;
        const r = b.getBoundingClientRect(); if (r.top < grenze - .5) p.push(`„${b.textContent.trim().slice(0, 24)}“ bei y=${Math.round(r.top)}`);
      }
      return p;
    },
    uhr() { const r = document.getElementById('uhr').getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10).join(','); },
    zifferblatt(profil) {
      const r = document.getElementById('uhr').getBoundingClientRect(), s = r.width / 234, out = {};
      out.stundenzahlen = +(17 * s).toFixed(1); out.minutenzahlen = +(11.5 * s).toFixed(1); out.alleMinuten = +(9.6 * s).toFixed(1);
      out.anteilHoehe = Math.round(r.height / innerHeight * 100); out.zifferblattAnteil = Math.round(r.height / 1.17 / innerHeight * 100);
      return out;
    }
  };
};
