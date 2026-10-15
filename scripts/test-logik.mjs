// Logiktests für die übernommene Fachlogik: node --test scripts/test-logik.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Z = require('../src/js/core/lernzeit.js');
const W = require('../src/js/core/worte.js');
const A = require('../src/js/core/aufgaben.js');
const zone = 'Europe/Berlin';
const at = (ymd, hm) => Z.wallToInstant(ymd, hm, zone);

test('Wortformen süddeutsch und hochdeutsch', () => {
  const cases = [
    [3 * 60, 'drei Uhr', 'drei Uhr'],
    [60, 'ein Uhr', 'ein Uhr'],
    [3 * 60 + 15, 'viertel vier', 'Viertel nach drei'],
    [3 * 60 + 30, 'halb vier', 'halb vier'],
    [3 * 60 + 45, 'dreiviertel vier', 'Viertel vor vier'],
    [3 * 60 + 25, 'fünf vor halb vier', 'fünfundzwanzig nach drei'],
    [3 * 60 + 35, 'fünf nach halb vier', 'fünfundzwanzig vor vier'],
    [3 * 60 + 10, 'zehn nach drei', 'zehn nach drei'],
    [3 * 60 + 1, 'eine Minute nach drei', 'eine Minute nach drei'],
    [3 * 60 + 27, 'siebenundzwanzig Minuten nach drei', 'siebenundzwanzig Minuten nach drei'],
    [12 * 60 + 15, 'viertel eins', 'Viertel nach zwölf'],
    [23 * 60 + 45, 'dreiviertel zwölf', 'Viertel vor zwölf'],
    [0, 'zwölf Uhr', 'zwölf Uhr'],
  ];
  for (const [t, sued, hoch] of cases) {
    assert.equal(W.timeWords(t, 'sued'), sued, `süd ${t}`);
    assert.equal(W.timeWords(t, 'hoch'), hoch, `hoch ${t}`);
  }
});

test('Prüfung der Worte nimmt beide Sprechweisen und Varianten an', () => {
  const t = 3 * 60 + 15;
  for (const ok of ['viertel vier', 'Viertel nach drei', 'Es ist viertel vier.', 'VIERTEL NACH DREI', 'fünfzehn Minuten nach drei'])
    assert.ok(W.validWordAnswer(ok, t), ok);
  for (const bad of ['viertel drei', 'dreiviertel vier', 'halb vier'])
    assert.ok(!W.validWordAnswer(bad, t), bad);
  assert.ok(W.validWordAnswer('zehn vor halb vier', 3 * 60 + 20));
  assert.ok(W.validWordAnswer('zwanzig nach drei', 3 * 60 + 20));
  assert.ok(W.validWordAnswer('drei', 3 * 60));
});

test('Jeder Wortbaustein ergibt mit der passenden Stunde eine gültige Antwort', () => {
  for (const level of ['full', 'half', 'quarter', 'five']) for (const region of ['sued', 'hoch']) {
    for (const minute of A.minuteChoices[level]) for (let h = 0; h < 24; h++) {
      const time = h * 60 + minute;
      const expected = W.timeWords(time, region);
      const hits = [];
      for (const tile of W.tiles(level, region)) for (let i = 0; i < 12; i++)
        if (W.normalize(W.buildPhrase(tile, i)) === W.normalize(expected)) hits.push([tile.label, i]);
      assert.equal(hits.length, 1, `${level}/${region} ${time}: ${expected}`);
      assert.ok(W.validWordAnswer(W.buildPhrase(W.tiles(level, region).find(t => t.label === hits[0][0]), hits[0][1]), time));
    }
  }
  // Alle Minuten: Minutenzahl über das Ziffernfeld
  const tile = W.countTile('nach', 27);
  assert.ok(W.validWordAnswer(W.buildPhrase(tile, 2), 3 * 60 + 27));
  assert.ok(W.validWordAnswer(W.buildPhrase(W.countTile('vor', 10), 3), 3 * 60 + 50));
  assert.ok(W.validWordAnswer(W.buildPhrase(W.countTile('nach', 1), 2), 3 * 60 + 1));
});

test('Zielzeiten: 1 bis 4 Stunden später, im Raster der Lernstufe, auch über Mitternacht und Zeitumstellung', () => {
  const starts = [at('2026-10-15', 9 * 60), at('2026-10-15', 22 * 60 + 30), at('2026-03-29', 0), at('2026-10-25', 0), at('2026-12-31', 23 * 60)];
  for (const level of A.LEVELS) for (const start of starts) for (let r = 0; r < 1; r += 0.07) {
    const target = Z.randomPracticeTarget(start, level, zone, () => r);
    const diff = (target - start) / Z.MIN;
    assert.ok(diff >= 60 && diff <= 240, `${level} Abstand ${diff}`);
    const p = Z.parts(target, zone);
    assert.equal((p.hour * 60 + p.minute) % A.STEP[level], 0, `${level} Raster`);
  }
});

test('Auswahlfelder: vier verschiedene Zeiten aus derselben Tageshälfte, richtige dabei', () => {
  for (const level of A.LEVELS) for (const time of [0, 9 * 60, 14 * 60 + 45, 23 * 60 + 59]) {
    const t = level === 'any' ? time : A.snapDown(time, level);
    for (let i = 0; i < 20; i++) {
      const c = A.buildAnswerChoices(t, level);
      assert.equal(new Set(c).size, 4);
      assert.ok(c.includes(t));
      assert.ok(c.every(v => Math.floor(v / 720) === Math.floor(t / 720)));
      const d = A.durationChoices(135, level === 'any' ? 'any' : 'quarter');
      assert.equal(new Set(d).size, 4);
      assert.ok(d.includes(135));
    }
  }
});

test('Zeitumstellung: fehlende Stunde springt vor, doppelte Stunde nimmt die erste', () => {
  const spring = at('2026-03-29', 2 * 60 + 30);
  assert.equal(Z.clock(spring, zone), '03:30');
  const autumn = at('2026-10-25', 2 * 60 + 30);
  assert.equal(Z.offset(autumn, zone), 120);
  const [start, end] = Z.dayBounds('2026-10-25', zone);
  assert.equal((end - start) / Z.MIN, 25 * 60);
});

test('Sonne in Herrieden wie in der Vorlage (15. Oktober 2026)', () => {
  const s = Z.solar('2026-10-15', Z.places.herrieden);
  assert.equal(Z.clock(s.sunrise, zone), '07:39');
  assert.equal(Z.clock(s.sunset, zone), '18:28');
  assert.equal(Z.duration(s.length), '10 Std. 49 Min.');
  const summer = Z.solar('2026-06-21', Z.places.herrieden), winter = Z.solar('2026-12-21', Z.places.herrieden);
  assert.ok(summer.length > 16 * 60 && winter.length < 8.5 * 60);
});

test('Raster abrunden und Dauertext', () => {
  assert.equal(A.snapDown(9 * 60 + 47, 'quarter'), 9 * 60 + 45);
  assert.equal(A.snapNearest(9 * 60 + 53, 'quarter'), 10 * 60);
  assert.equal(A.durationLabel(135), '2 Std. 15 Min.');
  assert.equal(W.spokenDigits(14 * 60 + 45), 'vierzehn Uhr fünfundvierzig');
});
