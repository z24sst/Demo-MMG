# Demo-MMG

Live-Demo für Vortrag am Gymnasium: KI in der Arbeitswelt – Notenrechner & Klausur-Countdown

## Noten-Coach

Eine Single-Page-Webapp ohne Build-Schritt und ohne Abhängigkeiten – nur HTML, CSS und JavaScript.

| Datei | Inhalt |
| --- | --- |
| `index.html` | Struktur der Seite (Noten, Durchschnitt, Zielrechner, Countdown) |
| `style.css` | Layout, responsive Karten und Farblogik |
| `app.js` | Berechnungen, Speicherung im `localStorage`, Rendering |

### Funktionen

- **Noten erfassen**: Fach, Note (1–6) und Gewichtung eintragen, einzelne Noten wieder löschen.
- **Durchschnitt**: gewichteter Gesamtschnitt und Schnitt pro Fach, farblich markiert
  (grün ≤ 2,5 · gelb ≤ 3,5 · rot darüber).
- **„Was brauche ich?“**: berechnet, welche Note in der nächsten Arbeit für den Wunschschnitt nötig ist –
  inklusive Hinweis, wenn das Ziel nicht mehr erreichbar oder bereits sicher ist.
- **Klausur-Countdown**: Termine eintragen, verbleibende Tage werden sortiert und farblich hervorgehoben.
- **Demo-Daten**: beim ersten Start vorbefüllt, jederzeit über den Button im Footer zurücksetzbar.

Alle Daten bleiben lokal im Browser (`localStorage`), es wird nichts an einen Server gesendet.

### Starten

`index.html` direkt im Browser öffnen – fertig.

Alternativ mit einem lokalen Server:

```bash
python3 -m http.server 8000
# danach http://localhost:8000 öffnen
```

### Ablauf für die Live-Demo

1. Startseite mit Demo-Daten zeigen: Schnitt und Countdown sind sofort sichtbar.
2. Eine schlechte Note ergänzen und beobachten, wie die Farbe des Schnitts umschlägt.
3. Im Zielrechner einen Wunschschnitt setzen und die nötige Note berechnen lassen.
4. Eine neue Klausur eintragen – der Countdown sortiert sich automatisch ein.
5. Mit „Demo-Daten zurücksetzen“ für den nächsten Durchgang aufräumen.
