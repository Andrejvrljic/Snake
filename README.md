# 🐍 Snake

Klassisches Snake im Browser – ohne Abhängigkeiten, ohne Build-Schritt.
GitHub Actions testet die Spiellogik bei jedem Push und veröffentlicht das Spiel automatisch auf GitHub Pages.

## Spielen

- **Pfeiltasten** oder **WASD** zum Lenken
- **Leertaste / P / Esc** = Pause
- **Enter / R** = Neustart nach Game Over
- Auf dem Handy: auf dem Feld **wischen** oder das Steuerkreuz benutzen

Jedes Futter gibt einen Punkt und macht die Schlange etwas schneller. Der Rekord wird im Browser gespeichert.

## Lokal starten

```bash
npm start        # startet einen kleinen Webserver, dann http://localhost:3000 öffnen
npm test         # Tests der Spiellogik (Node 20+)
```

(Die Seite braucht einen Webserver, weil sie ES-Module lädt – `index.html` per Doppelklick geht nicht.)

## GitHub Actions

Der Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) läuft bei jedem Push und Pull Request:

1. **Tests** – Syntax-Check und `npm test` auf Node 20 und 22
2. **Seite bauen** – packt `index.html`, `style.css` und `src/` ein (nur auf dem Standard-Branch)
3. **Veröffentlichen** – deployt auf GitHub Pages

### Einmalig einrichten

Im Repository unter **Settings → Pages → Build and deployment → Source** den Eintrag **„GitHub Actions“** auswählen.
Danach ist das Spiel nach jedem Push auf den Standard-Branch unter
`https://<benutzername>.github.io/<repo>/` erreichbar.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `src/game.js` | Reine Spiellogik (Bewegung, Fressen, Kollision) – ohne DOM, daher testbar |
| `src/main.js` | Zeichnen auf dem Canvas, Tastatur/Touch, Spielschleife |
| `test/game.test.js` | Tests mit dem eingebauten `node:test` |
