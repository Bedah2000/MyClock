# Meine Lernuhr

Web-App für den Förderschwerpunkt geistige Entwicklung (Berufsschulstufe): Eine Lehrkraft erklärt die Uhrzeit am eScreen, Schülerinnen und Schüler üben allein oder zu zweit am iPad. Die Uhr steht in jedem Bereich und jedem Schritt an derselben Stelle und ist das größte Element.

- **Zeigen:** Zeiger ziehen (gekoppelt), Laufwerk wie am Walkman (◀◀ ◀ ■ ▶ ▶▶), Zufallszeit (Würfel), „Jetzt“ mit tickendem Sekundenzeiger, vergangene Zeit als Fläche und in Std./Min. Eine Stufe (Stunde bis Minute) bestimmt Zufallsschritt, Einrasten und passende Hilfen; jede Hilfe lässt sich mit einem Tipp ändern, die Stufe merkt sich die Änderung. Uhrzeit in Worten süddeutsch, hochdeutsch oder beide nebeneinander, Vorlesen nur auf Tipp.
- **Quiz:** Runde mit 3, 5 oder 8 Aufgaben. Die Zeit läuft 1 bis 4 Stunden zur Zielzeit, dann wird die Uhrzeit erraten, dann die Zeitdauer. Lernstufen volle, halbe, Viertelstunden, 5 Minuten, alle Minuten. Leicht mit vier Auswahlfeldern, Schwer mit eigenem Ziffernfeld oder, bei Worten, mit Wortbausteinen.
- **Sonne:** Himmel hinter der Uhr und Horizontband darunter folgen Uhrzeit und Datum. Aufgang, Untergang, Tageslänge, Sonnenhöhe, Jahresband, Sommer und Winter im Vergleich, optional der Mond. Ort voreingestellt auf Herrieden.

Vollständig offline, keine Anfragen ins Netz, keine Daten über Lernende.

## Endprodukte

`npm run build` erzeugt in `dist/`:

| Datei | Titel in mebis | Start |
|---|---|---|
| `lernuhr-scorm.zip` | Meine Lernuhr | Zeigen |
| `lernuhr-quiz-volle-stunden.zip` | Lernuhr – Quiz volle Stunden | Quiz, Lernstufe voreingestellt |
| `lernuhr-quiz-halbe-stunden.zip` | Lernuhr – Quiz halbe Stunden | 〃 |
| `lernuhr-quiz-viertelstunden.zip` | Lernuhr – Quiz Viertelstunden | 〃 |
| `lernuhr-quiz-5-minuten.zip` | Lernuhr – Quiz 5 Minuten | 〃 |
| `lernuhr-quiz-alle-minuten.zip` | Lernuhr – Quiz alle Minuten | 〃 |
| `lernuhr.html` | – | eigenständige Prüf- und Notfallfassung, startet in Zeigen |

Jedes Paket ist SCORM 1.2 und enthält `imsmanifest.xml`, `index.html` (alles eingebettet) und das unveränderte `scorm.js` der Vorlage. Die Voreinstellung steht als kleines Objekt in der HTML-Datei, weil mebis keine URL-Parameter durchreicht.

## Bauen

Voraussetzung: Node.js 18 oder neuer. Es gibt keine Abhängigkeiten.

Alle Schriften und Bilder liegen im Repository und sind frei nutzbar (siehe „Schriften und Bilder“ unten). Lizenzierte Dateien braucht der Bau nicht.

```sh
npm run build
```

## Prüfen

```sh
npm test                      # Logik: Wortformen, Aufgaben, Zeitumstellung, Mitternacht, Sonnenzeiten
npm i --no-save playwright    # einmalig, falls Playwright nicht global installiert ist
npx playwright install chromium
npm run pruefen               # Chromium mit Touch-Emulation, App im iframe als mebis-Rahmen
```

`npm run pruefen` spielt alle Bereiche und vollständige Quizabläufe (Leicht, Schwer, Worte süddeutsch und hochdeutsch, Wortbausteine) auf drei Größen durch: eScreen 1600 × 800, iPad quer 1000 × 652 und iPad hoch 760 × 952 (jeweils App-Fläche unter einer 48 px hohen mebis-Leiste). Geprüft werden kein Scrollen, Mindestgrößen, gleiche Position und Größe der Uhr in allen Schritten, Reichweite am eScreen, Ziehen mit Touch und zweitem Finger, Einrasten, Drehen ohne Zustandsverlust, gesperrter `localStorage`, keine Netzwerkanfragen, keine JavaScript-Fehler und jedes SCORM-Paket mit Manifest und Voreinstellung. Ergebnis: `docs/pruefbericht.md`, Bildschirmbilder in `docs/screens/`.

Ersatz für Safari (WebKit-Engine, nicht Safari selbst):

```sh
sudo apt install webkit2gtk-driver xvfb
xvfb-run -a node scripts/pruefen-webkit.mjs   # Ergebnis: docs/pruefbericht-webkit.md
```

## Einsatz in mebis

1. Im Kurs den Bearbeitungsmodus einschalten, Aktivität „Lernpaket“ (SCORM) hinzufügen und die gewünschte ZIP-Datei hochladen. Bezeichnungen können je nach mebis-Version etwas abweichen.
2. Darstellung: im aktuellen Fenster, Breite und Höhe 100 %. Die App richtet sich nach der Rahmengröße. Für den eScreen kann „Neues Fenster“ mehr Fläche bringen.
3. Bewertung ist nicht nötig. Die App meldet nur „browsed“ an mebis, keine Punkte und keine Antworten.
4. Für Einzelarbeit am iPad das passende Lernstufen-Paket verknüpfen; es startet direkt im Quiz.

Der Knopf „Vollbild“ erscheint nur, wenn der Rahmen Vollbild erlaubt.

## Bedienung für die Lehrkraft

- **Zeigen an die Klasse anpassen:** rechts die Stufe wählen (Stunde, halbe, Viertel, 5 Min., Minute). Jede Stufe bringt passende Hilfen mit (Stundenzahlen, Minutenzahlen, alle Minuten, Stundenbereich, Hervorheben, Minutenzeiger, Einrasten). Darunter lassen sie sich einzeln an- und ausschalten; die Stufe merkt sich das auf diesem Gerät. Der Würfel stellt eine zufällige Uhrzeit im Schritt der Stufe ein. ▶ läuft 1 Minute pro Sekunde, ▶▶ 15 Minuten pro Sekunde, ■ hält an. Die Stufe ist dieselbe wie die Lernstufe im Quiz.
- **Bereich wechseln:** oben links Zeigen, Quiz oder Sonne. In den Einstellungen (Reiter Gerät) lässt sich die Bereichswahl für Schüler sperren.
- **Einstellungen:** Knopf oben rechts, dann den Regler nach rechts schieben. So öffnen Schüler das Blatt nicht aus Versehen. Das Blatt liegt neben der Uhr (quer) oder unter ihr (hoch), nie über ihr. Reiter: Quiz (Lernstufe, Antworten, Aufgabe, Sprechweise), Runde (Aufgaben je Runde, Tempo, Zeitdauer beim Ablauf zeigen), Anzeige (Zeiger sperren, Stundenzeiger, Sekundenzeiger, Himmel), Sonne (Ort, eigener Ort mit Koordinaten und Zeitzone, Mond), Gerät (Darstellung Auto/Tafel/Tablet, Farben Hell/Kontrast, Ton, Lob, Bereichswahl, Hilfen der Stufen zurücksetzen).
- **Quizrunde in unter 10 Sekunden:** Einstellungen, Regler, Lernstufe, Leicht/Schwer, Zahlen/Worte, Fertig. Mit einem Lernstufen-Paket entfällt das.
- **Darstellung:** Die App wählt Tafel (eScreen) oder Tablet (iPad) nach der verfügbaren Fläche; Geräte nur mit Maus bekommen immer Tablet. Wenn das nicht passt, im Reiter Gerät fest einstellen. Bedienelemente sind kompakt gehalten und tragen Symbole mit kurzer Beschriftung: Tafel mindestens 60 px hohe Knöpfe und 20 px Schrift, Tablet 44 px und 15 px (Beschriftungen unter Symbolen), Antworten 40 px bzw. 22 px.

## Zifferblatt

- Die Zeiger laufen über die Zahlen wie bei einer echten Uhr.
- Die Minutenzahlen stehen mittig in einem hellen Minutenring außen, in natürlicher Breite (nicht gestaucht). Das Innenblatt ist dafür etwas kleiner (93 %), die Minutenzahlen im 5-Minuten-Raster sind etwa 25 % höher als vorher. Bei „alle Minuten“ begrenzen die 60 Zahlen am Umfang der Ringmitte die Größe; sie sind deshalb kleiner als die 5er-Zahlen. Mit „Hervorheben“ erscheint die aktuelle Minute in voller Größe mit Rahmen.
- **Ziffern:** Atkinson Hyperlegible Next, entwickelt vom Braille Institute für Menschen mit Sehbehinderung: Eins mit Fahne ohne Fuß, offene Vier, Null ohne Schrägstrich. Dieselben Ziffern stehen in der Digitalanzeige, auf den Antworten und im Ziffernfeld.
- **Hervorheben:** Die aktuelle Stundenzahl wird größer und umrandet, die aktuelle Minutenzahl bekommt einen Rahmen (im 5-Minuten-Raster die zuletzt erreichte Zahl). Alle anderen Zahlen werden grau und blass.

`npm run pruefen` rastert die Minutenzahlen pixelgenau und prüft in beiden Schriften, dass keine Zahl eine andere berührt, alle mittig im Ring liegen und keine gestaucht ist.

## Uhrzeit in Worten: süddeutsch und hochdeutsch

Die Sprechweise ist überall wählbar. In **Zeigen** den Schalter „Worte“ einschalten und darunter „Süddeutsch“, „Hochdeutsch“ oder „Beide“ wählen. „Beide“ stellt die Formen nebeneinander, damit die Klasse die Unterschiede besprechen kann. Im **Quiz** gilt die Sprechweise aus den Einstellungen; bei Schwer richten sich die Wortbausteine nach ihr.

| Uhrzeit | süddeutsch | hochdeutsch |
|---|---|---|
| 3:15 | viertel vier | Viertel nach drei |
| 3:25 | fünf vor halb vier | fünfundzwanzig nach drei |
| 3:30 | halb vier | halb vier |
| 3:35 | fünf nach halb vier | fünfundzwanzig vor vier |
| 3:45 | dreiviertel vier | Viertel vor vier |

Bei der Prüfung von Wortbausteinen gelten beide Sprechweisen und übliche Varianten als richtig, zum Beispiel „zehn vor halb vier“ oder „zwanzig nach drei“ für 3:20 und „zehn Minuten nach drei“ für 3:10. Die angezeigten Formen stammen unverändert aus der Vorlage.

Bei Schwer gibt es zuerst den Minutenteil, dann die Stunde. Die Minutenteile stehen am eScreen so neben der Uhr, wie der Minutenzeiger steht: „nach“-Teile rechts, „vor“-Teile und „halb“ links. Bei „alle Minuten“ kommt die Minutenzahl über das Ziffernfeld.

## Struktur

```
src/        index.html, styles/, js/core/ (Fachlogik aus der Vorlage), js/vendor/ (SunCalc), js/ui/, scorm/
scripts/    build.mjs, test-logik.mjs, pruefen.mjs, pruefen-webkit.mjs, pruef-app.mjs, ziffern-bauen.py
dist/       erzeugt (nicht im Repository, enthält die eingebettete Schrift)
docs/       plan/ (freigegebener Plan), bestand/ (Bilder der Vorlage), screens/, Prüfberichte
vorlage/    scorm.js und imsmanifest.xml der Vorlage (index.html mit lizenzierten Dateien nur lokal, wird nicht gebraucht)
```

Übernommen aus der Vorlage: Zeitzonen, Zeitumstellung und Mitternacht (`lernzeit.js`), Zielzeiten und Auswahlfelder (`aufgaben.js`), Wortformen und ihre Prüfung (`worte.js`), Sonnen- und Mondberechnung mit SunCalc 2.1.1 (BSD-2-Lizenz, Hinweis im Quelltext).

## Schriften und Bilder

Alles, was in die App eingebettet wird, ist frei nutzbar und liegt in `src/assets/`. `npm run pruefen` stellt für jedes Paket sicher, dass keine andere Datei eingebettet ist.

| Datei | Inhalt | Lizenz |
|---|---|---|
| `andika-400.woff2` | Andika 6.101 Regular, lateinischer Teilsatz (Google Fonts, über `@fontsource/andika@5.3.0`), unverändert. Schrift von SIL International für Leseanfänger: einstöckiges a und g wie in der Schulschrift, I, l und 1 gut unterscheidbar. | SIL Open Font License 1.1, `andika-OFL.txt` |
| `ziffern-atkinson-400.woff2`, `ziffern-atkinson-600.woff2` | Atkinson Hyperlegible Next Regular und SemiBold, nur Ziffern 0–9, Null ohne Schrägstrich (abgeändert). `scripts/ziffern-bauen.py` erzeugt beide aus `@fontsource/atkinson-hyperlegible-next@5.3.0`. | SIL Open Font License 1.1, `ziffern-atkinson-OFL.txt` |
| `bilder/sonne.svg`, `bilder/mond.svg` | einfache eigene Zeichnungen als Platzhalter | Teil dieses Projekts |

### Eigene Bilder für Sonne und Mond

Eine Datei `src/assets/bilder/sonne.png` bzw. `mond.png` (auch `.webp` oder `.jpg`) ersetzt beim nächsten `npm run build` die mitgelieferte Zeichnung, ohne Änderung am Code. Quadratisch, transparenter Hintergrund, mindestens 256 × 256 Pixel; die App zeigt die Bilder etwa in Texthöhe.

Vorschlag für einen Bildgenerator (zum Beispiel ChatGPT), erst die Sonne, dann im selben Gespräch der Mond:

> Erstelle ein einfaches, freundliches Piktogramm einer Sonne für eine Lern-App für Jugendliche mit geistiger Behinderung: flacher Stil, gelbe Scheibe mit acht kurzen, abgerundeten Strahlen, kräftige dunkle Kontur, kein Gesicht, kein Schatten, kein Text, transparenter Hintergrund, mittig, quadratisch 1024 × 1024 Pixel. Eigene Gestaltung, keine Anlehnung an bestehende Symbolsammlungen.
>
> Jetzt im gleichen Stil eine Mondsichel in Hellgelb, gleiche Konturstärke, gleiche Größe und Anordnung.

Vor dem Einchecken prüfen, dass das Ergebnis kein bekanntes Symbol nachbildet. Rein maschinell erzeugte Bilder sind in Deutschland nach herrschender Meinung urheberrechtlich nicht geschützt; Rechte Dritter an ähnlichen Vorlagen bleiben davon unberührt.

## Datenschutz und Speicher

Keine Daten über Lernende, kein Tracking, keine Ergebnisse. `localStorage` speichert höchstens Darstellung, Farben, Ton, Lob und die Hilfen je Stufe dieses Geräts; ist der Speicher gesperrt, arbeitet die App mit den Voreinstellungen.
