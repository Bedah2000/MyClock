# Freigabeprüfung der Lernuhr, 18.10.2026

Ausgangspunkt: Commit `4a7dd2b29115684a7c5ef9fcf745d72771b7df49`.
Die bereits dort enthaltenen freigegebenen Änderungen wurden erhalten und ergänzt.

## Änderungen

- Stunden- und Minutenzeiger unabhängig ausblendbar; keine automatische Einblendung des anderen Zeigers.
- Lernstufe in beiden Ausrichtungen nach den Aktionen und vor den zusätzlichen Hilfen angeordnet.
- Bei schmalen oder niedrigen Fenstern vertikales Scrollen der Arbeitsfläche; keine negativen Layoutflächen.
- Bereichswahl bleibt oben. Kopfaktionen und Einstellungsreiter umbrechen bei wenig Breite.
- Ausgeschriebene Datumsrichtungen; verständlicher Zustand „Startzeit gemerkt“.
- Sommer- und Winterzeiten im Diagramm in getrennten Zeilen mit gemeinsamer Legende; astronomische Berechnung unverändert.

## Tatsächlich gerendert und visuell angesehen

Chromium 153, headless; die neu erzeugten Screenshots wurden direkt angesehen.
Keine ausschließliche Quelltextbeurteilung und keine Verwendung alter Repository-Screenshots als Testnachweis.

| Ansicht | Fläche in CSS-Pixeln | Prüfung |
| --- | --- | --- |
| Querformat | 1000 × 652 | Einstellungen, Sprechweisen, Erststart, Digital-/Wortanzeige, Zeiger, Sonne, Vergleich |
| Hochformat | 760 × 952 | Einstellungen, Sprechweisen, Gruppierung, Digital-/Wortanzeige, Sonne und Vergleich |
| Schmale Ansicht | 320 × 640 | umbrechende Reiter, Bedienung, gescrollte Einstellungen und Sonnensteuerung |
| 200%-Zoom-Simulation | 640 × 400 bei Pixelfaktor 2 | entspricht der verfügbaren CSS-Fläche bei 1280 × 800 und 200 %; gerendert, einschließlich Scrollzugang |

Die Zoomprüfung ist eine Simulation der CSS-Fläche und Pixeldichte, keine Betätigung des Browser-Zoommenüs.
Eine Safari-/WebKit-Prüfung und eine Prüfung am physischen iPad/eScreen wurden nicht durchgeführt.

## Zustände

- 12:00, 03:00 und weitere Zeigerüberlagerung bei ungefähr 01:05:27: breiter roter Stundenzeiger und längerer blauer Minutenzeiger sichtbar; Winkel zusätzlich rechnerisch geprüft.
- Herrieden, 18.10.2026, 12:00 Uhr: Sonne sichtbar über dem Horizont, Höhe ungefähr 29°; Aufgang 07:43, Untergang 18:22.
- Vergleich 21. Juni/21. Dezember: Bahnen und beide Sonnenstände sichtbar; Auf-/Untergangszeiten und Legende getrennt.
- Hervorheben: eine leuchtende Stundenzahl, elf blassere Zahlen und unveränderter Leuchtschein.
- Stundenbereich bleibt ein gefülltes Tortenstück; Außenringe bleiben beim Ausblenden der Minutenzahlen erhalten.
- Erststart: Digital- und Wortanzeige aus, nur Stundenzahlen, beide Zeiger, Mond an.
- Wechsel aller fünf Lernstufen verändert die Hilfenauswahl nicht; kein automatischer Minutenring.
- Formatwechsel erhält die Hilfen. Untere Einstellungen und Datumsaktionen sind durch Scrollen erreichbar.

## Automatische Prüfungen

- `npm test`: 8/8 vorhandene Logiktests bestanden.
- `node scripts/pruefen-freigabe.mjs`: vier Größen bestanden, keine JavaScript-Laufzeitfehler.
- `npm run build`: eigenständige HTML-Datei und sämtliche SCORM-Pakete erfolgreich erzeugt.
- `git diff --check`: bestanden.

Das neue Freigabeskript ergänzt die vorhandenen Logiktests. Die älteren Skripte und Berichte für die frühere feste Geometrie sind kein Testnachweis für diese Version.
