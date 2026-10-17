# Prüfbericht

Automatisch erzeugt von `scripts/pruefen.mjs` am 17.10.2026, 14:26:13 mit Chromium 141.0.7390.37 und Touch-Emulation. Die App läuft jeweils in einem iframe unter einer 48 px hohen Leiste als Nachbildung des mebis-Rahmens.

**331 von 331 Prüfungen bestanden.**

## escreen

| | Prüfung | Hinweis |
|---|---|---|
| ✅ | Vollbild-Knopf erscheint, wenn der Rahmen Vollbild erlaubt |  |
| ✅ | Layout erkannt: tafel |  |
| ✅ | Zeigen: vergangene Zeit als Fläche und in Std./Min. | seit 09:00 · 0 Std. 13 Min. |
| ✅ | zeigen: kein Scrollen, nichts ragt heraus |  |
| ✅ | zeigen: Mindestgrößen |  |
| ✅ | zeigen: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Zeiger liegen über den Zahlen (Minutenzeiger verdeckt um 5:00 die 12) | z-minute |
| ✅ | Hervorheben: andere Zahlen grau und blass (4:23 → Stunde 4, Minute 20) | 11 / 4 / 11 / 20 / 0.6 |
| ✅ | Minutenring: Zahlen mittig, ungestaucht, ohne Berührung |  |
| ✅ | Zeigen: „Jetzt“ zeigt die aktuelle Uhrzeit |  |
| ✅ | Sekundenzeiger springt auf die Minutenstriche | rotate(342) rotate(348) rotate(348) |
| ✅ | Laufwerk: ▶ langsam, ▶▶ schnell, ◀ rückwärts | ▶ 1.0 min, ▶▶ 16.0 min, danach ◀ 15.4 |
| ✅ | Zufall: Zeiger laufen nur vorwärts (höchstens 12 Stunden) | true,true,true,true |
| ✅ | Zufall: neue Uhrzeit im Viertelstunden-Schritt | 11:00, 22:30, 03:00, 06:45 |
| ✅ | Stufe merkt sich geänderte Hilfen; Worte und Digital bleiben gleich | [[false,true],[true,true,"quarter"]] |
| ✅ | Touch: Minutenzeiger von 9:00 um eine Viertelstunde gezogen | 09:15 |
| ✅ | Touch: kein Scrollen oder Zoomen beim Ziehen |  |
| ✅ | Touch: zweiter Finger löst nichts aus | Stufe blieb any |
| ✅ | Einrasten: Loslassen bei etwa 9:17 ergibt 9:15 | 09:15 |
| ✅ | quiz-start: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-start: Mindestgrößen |  |
| ✅ | quiz-start: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-lauf: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-lauf: Mindestgrößen |  |
| ✅ | quiz-lauf: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-frage: Mindestgrößen |  |
| ✅ | quiz-frage: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Quiz: Stundenbereich und Hervorheben erst nach Fehlversuchen |  |
| ✅ | Falsch: Felder ausgegraut, nach zwei Fehlversuchen Lernhilfe |  |
| ✅ | quiz-falsch: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-falsch: Mindestgrößen |  |
| ✅ | quiz-falsch: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-richtig: Mindestgrößen |  |
| ✅ | quiz-richtig: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-dauer: Mindestgrößen |  |
| ✅ | quiz-dauer: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | Quiz leicht: ganze Runde mit 5 Aufgaben, Fortschritt voll | ende/5/5 |
| ✅ | quiz-ende: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-ende: Mindestgrößen |  |
| ✅ | quiz-ende: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Einstellungen öffnen nur über den Schieberegler |  |
| ✅ | einstellungen: kein Scrollen, nichts ragt heraus |  |
| ✅ | einstellungen: Mindestgrößen |  |
| ✅ | einstellungen: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Einstellungen, Reiter runde: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter anzeige: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter sonne: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter geraet: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter quiz: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Eigener Ort: Eingabe passt ohne Scrollen |  |
| ✅ | eigener-ort: kein Scrollen, nichts ragt heraus |  |
| ✅ | eigener-ort: Mindestgrößen |  |
| ✅ | eigener-ort: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Eigener Ort: Koordinaten und Zeitzone übernommen | {"name":"Eigener Ort","lat":52.5,"lon":13.4,"zone":"Europe/London"} |
| ✅ | Bereichswahl lässt sich für Schüler sperren |  |
| ✅ | Blatt: Schwer und Viertelstunden eingestellt, geschlossen | schwer/quarter/false |
| ✅ | quiz-schwer-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-frage: Mindestgrößen |  |
| ✅ | quiz-schwer-frage: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-schwer-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-schwer-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-richtig: Mindestgrößen |  |
| ✅ | quiz-schwer-richtig: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-schwer-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-dauer: Mindestgrößen |  |
| ✅ | quiz-schwer-dauer: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Quiz schwer: Uhrzeit und Zeitdauer über das eigene Ziffernfeld |  |
| ✅ | quiz-worte-leicht-sued-quarter-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-frage: Mindestgrößen |  |
| ✅ | quiz-worte-leicht-sued-quarter-frage: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-worte-leicht-sued-quarter-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-worte-leicht-sued-quarter-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-richtig: Mindestgrößen |  |
| ✅ | quiz-worte-leicht-sued-quarter-richtig: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-worte-leicht-sued-quarter-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-dauer: Mindestgrößen |  |
| ✅ | quiz-worte-leicht-sued-quarter-dauer: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Quiz Worte leicht (süddeutsch, quarter) |  |
| ✅ | quiz-worte-schwer-sued-five-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-frage: Mindestgrößen |  |
| ✅ | quiz-worte-schwer-sued-five-frage: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-worte-schwer-sued-five-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-worte-schwer-sued-five-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-richtig: Mindestgrößen |  |
| ✅ | quiz-worte-schwer-sued-five-richtig: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | quiz-worte-schwer-sued-five-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-dauer: Mindestgrößen |  |
| ✅ | quiz-worte-schwer-sued-five-dauer: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Quiz Worte schwer (süddeutsch, five) |  |
| ✅ | quiz-worte-schwer-hoch-quarter-: Uhrzeit richtig erkannt |  |
| ✅ | Quiz Worte schwer (hochdeutsch, quarter) |  |
| ✅ | quiz-worte-schwer-sued-any-: Uhrzeit richtig erkannt |  |
| ✅ | Quiz Worte schwer (süddeutsch, any) |  |
| ✅ | quiz-wortbausteine: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-wortbausteine: Mindestgrößen |  |
| ✅ | quiz-wortbausteine: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | sonne: kein Scrollen, nichts ragt heraus |  |
| ✅ | sonne: Mindestgrößen |  |
| ✅ | sonne: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Sonne: Sommer (21. Juni) und Winter (21. Dezember) mit einem Tippen | 06-21 16 Std. 15 Min. / 12-21 8 Std. 11 Min. |
| ✅ | Sonne: Vergleich zeigt zwei Karten und geteilten Himmel |  |
| ✅ | sonne-vergleich: kein Scrollen, nichts ragt heraus |  |
| ✅ | sonne-vergleich: Mindestgrößen |  |
| ✅ | sonne-vergleich: Schüler-Bedienung in den unteren zwei Dritteln |  |
| ✅ | Sonne: Uhrzeit und Sonnenstand gekoppelt (Mittag hoch, Nacht dunkel) | 64° hoch / untergegangen |
| ✅ | Sonne: Antippen im Jahresband wählt ein Datum | 2026-06-25 |
| ✅ | Uhr in 22 Schritten an derselben Stelle (500,100,600,600) | 500,100,600,600 |
| ✅ | Uhr 75 % der Höhe (Zifferblatt 60 %) |  |
| ✅ | Ziffernhöhe: Stunden 41.3 px, Minuten 32.1 px (vorher 23.3 px), alle Minuten 14.9 px | alle Minuten sind durch 60 Zahlen am Umfang begrenzt |
| ✅ | Fernlesetest: Bild auf 25 % gespeichert (Sichtprüfung im Bericht) | docs/screens/escreen-fernlesetest-25prozent.png |
| ✅ | Keine Netzwerkanfragen außer Rahmen und App |  |
| ✅ | Keine JavaScript-Fehler |  |

## ipad-quer

| | Prüfung | Hinweis |
|---|---|---|
| ✅ | Vollbild-Knopf erscheint, wenn der Rahmen Vollbild erlaubt |  |
| ✅ | Layout erkannt: tablet |  |
| ✅ | Zeigen: vergangene Zeit als Fläche und in Std./Min. | seit 09:00 · 0 Std. 13 Min. |
| ✅ | zeigen: kein Scrollen, nichts ragt heraus |  |
| ✅ | zeigen: Mindestgrößen |  |
| ✅ | Zeiger liegen über den Zahlen (Minutenzeiger verdeckt um 5:00 die 12) | z-minute |
| ✅ | Hervorheben: andere Zahlen grau und blass (4:23 → Stunde 4, Minute 20) | 11 / 4 / 11 / 20 / 0.6 |
| ✅ | Minutenring: Zahlen mittig, ungestaucht, ohne Berührung |  |
| ✅ | Zeigen: „Jetzt“ zeigt die aktuelle Uhrzeit |  |
| ✅ | Sekundenzeiger springt auf die Minutenstriche | rotate(24) rotate(24) rotate(24) |
| ✅ | Laufwerk: ▶ langsam, ▶▶ schnell, ◀ rückwärts | ▶ 1.0 min, ▶▶ 15.8 min, danach ◀ 15.2 |
| ✅ | Zufall: Zeiger laufen nur vorwärts (höchstens 12 Stunden) | true,true,true,true |
| ✅ | Zufall: neue Uhrzeit im Viertelstunden-Schritt | 15:30, 19:15, 22:30, 10:15 |
| ✅ | Stufe merkt sich geänderte Hilfen; Worte und Digital bleiben gleich | [[false,true],[true,true,"quarter"]] |
| ✅ | quiz-start: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-start: Mindestgrößen |  |
| ✅ | quiz-lauf: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-lauf: Mindestgrößen |  |
| ✅ | quiz-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-frage: Mindestgrößen |  |
| ✅ | Quiz: Stundenbereich und Hervorheben erst nach Fehlversuchen |  |
| ✅ | Falsch: Felder ausgegraut, nach zwei Fehlversuchen Lernhilfe |  |
| ✅ | quiz-falsch: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-falsch: Mindestgrößen |  |
| ✅ | quiz-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-richtig: Mindestgrößen |  |
| ✅ | quiz-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-dauer: Mindestgrößen |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | Quiz leicht: ganze Runde mit 5 Aufgaben, Fortschritt voll | ende/5/5 |
| ✅ | quiz-ende: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-ende: Mindestgrößen |  |
| ✅ | Einstellungen öffnen nur über den Schieberegler |  |
| ✅ | einstellungen: kein Scrollen, nichts ragt heraus |  |
| ✅ | einstellungen: Mindestgrößen |  |
| ✅ | Einstellungen, Reiter runde: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter anzeige: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter sonne: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter geraet: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter quiz: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Eigener Ort: Eingabe passt ohne Scrollen |  |
| ✅ | eigener-ort: kein Scrollen, nichts ragt heraus |  |
| ✅ | eigener-ort: Mindestgrößen |  |
| ✅ | Eigener Ort: Koordinaten und Zeitzone übernommen | {"name":"Eigener Ort","lat":52.5,"lon":13.4,"zone":"Europe/London"} |
| ✅ | Bereichswahl lässt sich für Schüler sperren |  |
| ✅ | Blatt: Schwer und Viertelstunden eingestellt, geschlossen | schwer/quarter/false |
| ✅ | quiz-schwer-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-frage: Mindestgrößen |  |
| ✅ | quiz-schwer-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-schwer-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-richtig: Mindestgrößen |  |
| ✅ | quiz-schwer-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-dauer: Mindestgrößen |  |
| ✅ | Quiz schwer: Uhrzeit und Zeitdauer über das eigene Ziffernfeld |  |
| ✅ | quiz-worte-leicht-sued-quarter-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-frage: Mindestgrößen |  |
| ✅ | quiz-worte-leicht-sued-quarter-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-worte-leicht-sued-quarter-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-richtig: Mindestgrößen |  |
| ✅ | quiz-worte-leicht-sued-quarter-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-dauer: Mindestgrößen |  |
| ✅ | Quiz Worte leicht (süddeutsch, quarter) |  |
| ✅ | quiz-worte-schwer-sued-five-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-frage: Mindestgrößen |  |
| ✅ | quiz-worte-schwer-sued-five-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-worte-schwer-sued-five-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-richtig: Mindestgrößen |  |
| ✅ | quiz-worte-schwer-sued-five-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-dauer: Mindestgrößen |  |
| ✅ | Quiz Worte schwer (süddeutsch, five) |  |
| ✅ | quiz-worte-schwer-hoch-quarter-: Uhrzeit richtig erkannt |  |
| ✅ | Quiz Worte schwer (hochdeutsch, quarter) |  |
| ✅ | quiz-worte-schwer-sued-any-: Uhrzeit richtig erkannt |  |
| ✅ | Quiz Worte schwer (süddeutsch, any) |  |
| ✅ | quiz-wortbausteine: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-wortbausteine: Mindestgrößen |  |
| ✅ | sonne: kein Scrollen, nichts ragt heraus |  |
| ✅ | sonne: Mindestgrößen |  |
| ✅ | Sonne: Sommer (21. Juni) und Winter (21. Dezember) mit einem Tippen | 06-21 16 Std. 15 Min. / 12-21 8 Std. 11 Min. |
| ✅ | Sonne: Vergleich zeigt zwei Karten und geteilten Himmel |  |
| ✅ | sonne-vergleich: kein Scrollen, nichts ragt heraus |  |
| ✅ | sonne-vergleich: Mindestgrößen |  |
| ✅ | Sonne: Uhrzeit und Sonnenstand gekoppelt (Mittag hoch, Nacht dunkel) | 64° hoch / untergegangen |
| ✅ | Sonne: Antippen im Jahresband wählt ein Datum | 2026-06-25 |
| ✅ | Uhr in 22 Schritten an derselben Stelle (259,79,482,482) | 259,79,482,482 |
| ✅ | Ziffernhöhe: Stunden 33.1 px, Minuten 25.7 px (vorher 18.7 px), alle Minuten 11.9 px | alle Minuten sind durch 60 Zahlen am Umfang begrenzt |
| ✅ | Keine Netzwerkanfragen außer Rahmen und App |  |
| ✅ | Keine JavaScript-Fehler |  |

## ipad-hoch

| | Prüfung | Hinweis |
|---|---|---|
| ✅ | Vollbild-Knopf erscheint, wenn der Rahmen Vollbild erlaubt |  |
| ✅ | Layout erkannt: tablet |  |
| ✅ | Zeigen: vergangene Zeit als Fläche und in Std./Min. | 0 Std. 14 Min. |
| ✅ | zeigen: kein Scrollen, nichts ragt heraus |  |
| ✅ | zeigen: Mindestgrößen |  |
| ✅ | Zeiger liegen über den Zahlen (Minutenzeiger verdeckt um 5:00 die 12) | z-minute |
| ✅ | Hervorheben: andere Zahlen grau und blass (4:23 → Stunde 4, Minute 20) | 11 / 4 / 11 / 20 / 0.6 |
| ✅ | Minutenring: Zahlen mittig, ungestaucht, ohne Berührung |  |
| ✅ | Zeigen: „Jetzt“ zeigt die aktuelle Uhrzeit |  |
| ✅ | Sekundenzeiger springt auf die Minutenstriche | rotate(36) rotate(36) rotate(42) |
| ✅ | Laufwerk: ▶ langsam, ▶▶ schnell, ◀ rückwärts | ▶ 1.0 min, ▶▶ 15.8 min, danach ◀ 15.2 |
| ✅ | Zufall: Zeiger laufen nur vorwärts (höchstens 12 Stunden) | true,true,true,true |
| ✅ | Zufall: neue Uhrzeit im Viertelstunden-Schritt | 13:30, 14:30, 17:15, 22:30 |
| ✅ | Stufe merkt sich geänderte Hilfen; Worte und Digital bleiben gleich | [[false,true],[true,true,"quarter"]] |
| ✅ | Touch: Minutenzeiger von 9:00 um eine Viertelstunde gezogen | 09:15 |
| ✅ | Touch: kein Scrollen oder Zoomen beim Ziehen |  |
| ✅ | Touch: zweiter Finger löst nichts aus | Stufe blieb any |
| ✅ | Einrasten: Loslassen bei etwa 9:17 ergibt 9:15 | 09:15 |
| ✅ | quiz-start: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-start: Mindestgrößen |  |
| ✅ | quiz-lauf: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-lauf: Mindestgrößen |  |
| ✅ | quiz-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-frage: Mindestgrößen |  |
| ✅ | Quiz: Stundenbereich und Hervorheben erst nach Fehlversuchen |  |
| ✅ | Falsch: Felder ausgegraut, nach zwei Fehlversuchen Lernhilfe |  |
| ✅ | quiz-falsch: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-falsch: Mindestgrößen |  |
| ✅ | quiz-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-richtig: Mindestgrößen |  |
| ✅ | quiz-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-dauer: Mindestgrößen |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | leicht: Uhrzeit richtig erkannt |  |
| ✅ | Quiz leicht: ganze Runde mit 5 Aufgaben, Fortschritt voll | ende/5/5 |
| ✅ | quiz-ende: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-ende: Mindestgrößen |  |
| ✅ | Einstellungen öffnen nur über den Schieberegler |  |
| ✅ | einstellungen: kein Scrollen, nichts ragt heraus |  |
| ✅ | einstellungen: Mindestgrößen |  |
| ✅ | Einstellungen, Reiter runde: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter anzeige: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter sonne: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter geraet: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Einstellungen, Reiter quiz: passt ohne Scrollen, Mindestgrößen |  |
| ✅ | Eigener Ort: Eingabe passt ohne Scrollen |  |
| ✅ | eigener-ort: kein Scrollen, nichts ragt heraus |  |
| ✅ | eigener-ort: Mindestgrößen |  |
| ✅ | Eigener Ort: Koordinaten und Zeitzone übernommen | {"name":"Eigener Ort","lat":52.5,"lon":13.4,"zone":"Europe/London"} |
| ✅ | Bereichswahl lässt sich für Schüler sperren |  |
| ✅ | Blatt: Schwer und Viertelstunden eingestellt, geschlossen | schwer/quarter/false |
| ✅ | quiz-schwer-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-frage: Mindestgrößen |  |
| ✅ | quiz-schwer-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-schwer-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-richtig: Mindestgrößen |  |
| ✅ | quiz-schwer-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-schwer-dauer: Mindestgrößen |  |
| ✅ | Quiz schwer: Uhrzeit und Zeitdauer über das eigene Ziffernfeld |  |
| ✅ | quiz-worte-leicht-sued-quarter-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-frage: Mindestgrößen |  |
| ✅ | quiz-worte-leicht-sued-quarter-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-worte-leicht-sued-quarter-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-richtig: Mindestgrößen |  |
| ✅ | quiz-worte-leicht-sued-quarter-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-leicht-sued-quarter-dauer: Mindestgrößen |  |
| ✅ | Quiz Worte leicht (süddeutsch, quarter) |  |
| ✅ | quiz-worte-schwer-sued-five-frage: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-frage: Mindestgrößen |  |
| ✅ | quiz-worte-schwer-sued-five-: Uhrzeit richtig erkannt |  |
| ✅ | quiz-worte-schwer-sued-five-richtig: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-richtig: Mindestgrößen |  |
| ✅ | quiz-worte-schwer-sued-five-dauer: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-worte-schwer-sued-five-dauer: Mindestgrößen |  |
| ✅ | Quiz Worte schwer (süddeutsch, five) |  |
| ✅ | quiz-worte-schwer-hoch-quarter-: Uhrzeit richtig erkannt |  |
| ✅ | Quiz Worte schwer (hochdeutsch, quarter) |  |
| ✅ | quiz-worte-schwer-sued-any-: Uhrzeit richtig erkannt |  |
| ✅ | Quiz Worte schwer (süddeutsch, any) |  |
| ✅ | quiz-wortbausteine: kein Scrollen, nichts ragt heraus |  |
| ✅ | quiz-wortbausteine: Mindestgrößen |  |
| ✅ | sonne: kein Scrollen, nichts ragt heraus |  |
| ✅ | sonne: Mindestgrößen |  |
| ✅ | Sonne: Sommer (21. Juni) und Winter (21. Dezember) mit einem Tippen | 06-21 16 Std. 15 Min. / 12-21 8 Std. 11 Min. |
| ✅ | Sonne: Vergleich zeigt zwei Karten und geteilten Himmel |  |
| ✅ | sonne-vergleich: kein Scrollen, nichts ragt heraus |  |
| ✅ | sonne-vergleich: Mindestgrößen |  |
| ✅ | Sonne: Uhrzeit und Sonnenstand gekoppelt (Mittag hoch, Nacht dunkel) | 64° hoch / untergegangen |
| ✅ | Sonne: Antippen im Jahresband wählt ein Datum | 2026-06-25 |
| ✅ | Uhr in 22 Schritten an derselben Stelle (107.5,76,545,545) | 107.5,76,545,545 |
| ✅ | Ziffernhöhe: Stunden 37.5 px, Minuten 29.1 px (vorher 21.1 px), alle Minuten 13.5 px | alle Minuten sind durch 60 Zahlen am Umfang begrenzt |
| ✅ | Drehen ins Querformat: Zustand bleibt erhalten | quer |
| ✅ | Nach dem Drehen: kein Scrollen, nichts ragt heraus |  |
| ✅ | Zurück ins Hochformat: Zustand bleibt erhalten |  |
| ✅ | Keine Netzwerkanfragen außer Rahmen und App |  |
| ✅ | Keine JavaScript-Fehler |  |

## speicher

| | Prüfung | Hinweis |
|---|---|---|
| ✅ | Vollbild-Knopf fehlt, wenn der Rahmen kein Vollbild erlaubt |  |
| ✅ | Gesperrter localStorage: App startet, Quiz läuft, Einstellungen wirken |  |

## pakete

| | Prüfung | Hinweis |
|---|---|---|
| ✅ | lernuhr-scorm.zip: gültiges Manifest (SCORM 1.2), Dateien vollständig, Titel „Meine Lernuhr“ |  |
| ✅ | lernuhr-scorm: nur freie Schriften und Bilder eingebettet (4 Dateien) |  |
| ✅ | lernuhr-scorm: Voreinstellung greift beim Start (zeigen), SCORM initialisiert |  / LMSInitialize,cmi.core.lesson_status=browsed,LMSCommit |
| ✅ | lernuhr-quiz-volle-stunden.zip: gültiges Manifest (SCORM 1.2), Dateien vollständig, Titel „Lernuhr – Quiz volle Stunden“ |  |
| ✅ | lernuhr-quiz-volle-stunden: nur freie Schriften und Bilder eingebettet (4 Dateien) |  |
| ✅ | lernuhr-quiz-volle-stunden: Voreinstellung greift beim Start (quiz, full), SCORM initialisiert | Lernstufe: volle Stunden / LMSInitialize,cmi.core.lesson_status=browsed,LMSCommit |
| ✅ | lernuhr-quiz-halbe-stunden.zip: gültiges Manifest (SCORM 1.2), Dateien vollständig, Titel „Lernuhr – Quiz halbe Stunden“ |  |
| ✅ | lernuhr-quiz-halbe-stunden: nur freie Schriften und Bilder eingebettet (4 Dateien) |  |
| ✅ | lernuhr-quiz-halbe-stunden: Voreinstellung greift beim Start (quiz, half), SCORM initialisiert | Lernstufe: halbe Stunden / LMSInitialize,cmi.core.lesson_status=browsed,LMSCommit |
| ✅ | lernuhr-quiz-viertelstunden.zip: gültiges Manifest (SCORM 1.2), Dateien vollständig, Titel „Lernuhr – Quiz Viertelstunden“ |  |
| ✅ | lernuhr-quiz-viertelstunden: nur freie Schriften und Bilder eingebettet (4 Dateien) |  |
| ✅ | lernuhr-quiz-viertelstunden: Voreinstellung greift beim Start (quiz, quarter), SCORM initialisiert | Lernstufe: Viertelstunden / LMSInitialize,cmi.core.lesson_status=browsed,LMSCommit |
| ✅ | lernuhr-quiz-5-minuten.zip: gültiges Manifest (SCORM 1.2), Dateien vollständig, Titel „Lernuhr – Quiz 5 Minuten“ |  |
| ✅ | lernuhr-quiz-5-minuten: nur freie Schriften und Bilder eingebettet (4 Dateien) |  |
| ✅ | lernuhr-quiz-5-minuten: Voreinstellung greift beim Start (quiz, five), SCORM initialisiert | Lernstufe: 5 Minuten / LMSInitialize,cmi.core.lesson_status=browsed,LMSCommit |
| ✅ | lernuhr-quiz-alle-minuten.zip: gültiges Manifest (SCORM 1.2), Dateien vollständig, Titel „Lernuhr – Quiz alle Minuten“ |  |
| ✅ | lernuhr-quiz-alle-minuten: nur freie Schriften und Bilder eingebettet (4 Dateien) |  |
| ✅ | lernuhr-quiz-alle-minuten: Voreinstellung greift beim Start (quiz, any), SCORM initialisiert | Lernstufe: alle Minuten / LMSInitialize,cmi.core.lesson_status=browsed,LMSCommit |

