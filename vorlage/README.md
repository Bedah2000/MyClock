# Vorlage

Bisheriges SCORM-Paket „Meine Lernuhr“: `scorm.js`, `imsmanifest.xml` und `index.html`.

`index.html` enthält die Schrift Bayerndruck und zwei METACOM-Symbole eingebettet und liegt deshalb
**nicht** im Repository (siehe `.gitignore`). Für den Bau die Datei aus dem bisherigen Paket
hierher kopieren; das Bauskript holt Schrift und Symbole daraus, falls `src/assets/` leer ist.
