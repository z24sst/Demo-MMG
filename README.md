# Demo-MMG

Live-Demo für Vortrag am Gymnasium: KI in der Arbeitswelt – Punkterechner & Klausur-Countdown

## Noten-Coach

Eine Single-Page-Webapp ohne Build-Schritt und ohne Abhängigkeiten – nur HTML, CSS und JavaScript.

| Datei | Inhalt |
| --- | --- |
| `index.html` | Struktur der Seite (Punkte, Durchschnitt, Zielrechner, Countdown) |
| `style.css` | Layout, responsive Karten und Farblogik |
| `app.js` | Berechnungen, Speicherung im `localStorage`, Rendering |

### Funktionen

- **Punkte erfassen**: Fach, Punkte (0–15) und Gewichtung eintragen, einzelne Einträge wieder löschen.
- **Durchschnitt**: gewichteter Gesamtschnitt und Schnitt pro Fach, farblich markiert
  (grün ab 10 Punkten · gelb ab 7 Punkten · rot darunter).
- **„Was brauche ich?“**: berechnet, wie viele Punkte in der nächsten Arbeit für den Wunschschnitt nötig sind –
  inklusive Hinweis, wenn das Ziel nicht mehr erreichbar oder bereits sicher ist.
- **Klausur-Countdown**: Termine eintragen, verbleibende Tage werden sortiert und farblich hervorgehoben.
- **Demo-Daten**: beim ersten Start vorbefüllt, jederzeit über den Button im Footer zurücksetzbar.

### Punkte und Noten

| Punkte | Note |
| --- | --- |
| 15–13 | 1 |
| 12–10 | 2 |
| 9–7 | 3 |
| 6–4 | 4 |
| 3–1 | 5 |
| 0 | 6 |

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
2. Eine schlechte Punktzahl ergänzen und beobachten, wie die Farbe des Schnitts umschlägt.
3. Im Zielrechner einen Wunschschnitt setzen und die nötigen Punkte berechnen lassen.
4. Eine neue Klausur eintragen – der Countdown sortiert sich automatisch ein.
5. Mit „Demo-Daten zurücksetzen“ für den nächsten Durchgang aufräumen.
