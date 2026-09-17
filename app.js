(function () {
  'use strict';

  var STORAGE_KEY = 'noten-coach-v1';
  var THEME_KEY = 'noten-coach-theme';
  var CONFIG_URL = 'config.json';
  var MS_PRO_TAG = 24 * 60 * 60 * 1000;

  var state = { noten: [], klausuren: [] };

  var el = {
    notenForm: document.getElementById('noten-form'),
    fach: document.getElementById('fach'),
    note: document.getElementById('note'),
    gewicht: document.getElementById('gewicht'),
    notenFehler: document.getElementById('noten-fehler'),
    notenListe: document.getElementById('noten-liste'),
    notenLeer: document.getElementById('noten-leer'),
    schnitt: document.getElementById('schnitt'),
    schnittText: document.getElementById('schnitt-text'),
    fachListe: document.getElementById('fach-liste'),
    zielForm: document.getElementById('ziel-form'),
    zielFach: document.getElementById('ziel-fach'),
    zielNote: document.getElementById('ziel-note'),
    zielGewicht: document.getElementById('ziel-gewicht'),
    zielErgebnis: document.getElementById('ziel-ergebnis'),
    klausurForm: document.getElementById('klausur-form'),
    klausurFach: document.getElementById('klausur-fach'),
    klausurDatum: document.getElementById('klausur-datum'),
    klausurFehler: document.getElementById('klausur-fehler'),
    klausurListe: document.getElementById('klausur-liste'),
    klausurLeer: document.getElementById('klausur-leer'),
    resetBtn: document.getElementById('reset-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    themeToggleIcon: document.getElementById('theme-toggle-icon'),
    themeToggleText: document.getElementById('theme-toggle-text')
  };

  /* ---------- Hilfsfunktionen ---------- */

  function id() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function formatNote(wert) {
    return wert.toFixed(1).replace('.', ',');
  }

  function stufeFuerNote(schnitt) {
    if (schnitt <= 2.5) return 'gut';
    if (schnitt <= 3.5) return 'mittel';
    return 'kritisch';
  }

  function heuteOhneZeit() {
    var jetzt = new Date();
    return new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
  }

  function datumAusIso(iso) {
    var teile = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!teile) return null;
    var datum = new Date(Number(teile[1]), Number(teile[2]) - 1, Number(teile[3]));
    if (datum.getMonth() !== Number(teile[2]) - 1) return null;
    return datum;
  }

  function isoAusDatum(datum) {
    var monat = String(datum.getMonth() + 1).padStart(2, '0');
    var tag = String(datum.getDate()).padStart(2, '0');
    return datum.getFullYear() + '-' + monat + '-' + tag;
  }

  function tageBis(iso) {
    var ziel = datumAusIso(iso);
    if (!ziel) return null;
    return Math.round((ziel.getTime() - heuteOhneZeit().getTime()) / MS_PRO_TAG);
  }

  function datumLesbar(iso) {
    var datum = datumAusIso(iso);
    if (!datum) return iso;
    return datum.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function zeigeFehler(knoten, text) {
    if (!text) {
      knoten.hidden = true;
      knoten.textContent = '';
      return;
    }
    knoten.textContent = text;
    knoten.hidden = false;
  }

  /* ---------- Berechnungen ---------- */

  function gewichteterSchnitt(eintraege) {
    var summeGewicht = 0;
    var summeNoten = 0;
    eintraege.forEach(function (eintrag) {
      summeGewicht += eintrag.gewicht;
      summeNoten += eintrag.note * eintrag.gewicht;
    });
    if (summeGewicht === 0) return null;
    return summeNoten / summeGewicht;
  }

  function faecher() {
    var namen = [];
    state.noten.forEach(function (eintrag) {
      if (namen.indexOf(eintrag.fach) === -1) namen.push(eintrag.fach);
    });
    return namen.sort(function (a, b) {
      return a.localeCompare(b, 'de');
    });
  }

  function notenFuerFach(fach) {
    return state.noten.filter(function (eintrag) {
      return eintrag.fach === fach;
    });
  }

  function benoetigteNote(fach, wunschschnitt, gewichtDerArbeit) {
    var eintraege = notenFuerFach(fach);
    var summeGewicht = 0;
    var summeNoten = 0;
    eintraege.forEach(function (eintrag) {
      summeGewicht += eintrag.gewicht;
      summeNoten += eintrag.note * eintrag.gewicht;
    });
    var gesamtGewicht = summeGewicht + gewichtDerArbeit;
    return (wunschschnitt * gesamtGewicht - summeNoten) / gewichtDerArbeit;
  }

  /* ---------- Darkmode ---------- */

  function istTheme(wert) {
    return wert === 'light' || wert === 'dark';
  }

  function aktivesTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setzeTheme(theme) {
    var gewaehlt = istTheme(theme) ? theme : 'light';
    var istDunkel = gewaehlt === 'dark';

    document.documentElement.setAttribute('data-theme', gewaehlt);
    el.themeToggle.setAttribute('aria-pressed', istDunkel ? 'true' : 'false');
    el.themeToggleIcon.textContent = istDunkel ? '☀️' : '🌙';
    el.themeToggleText.textContent = istDunkel ? 'Lightmode' : 'Darkmode';
    el.themeToggle.setAttribute('title', istDunkel ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln');
  }

  function themeAusSpeicher() {
    var wert;
    try {
      wert = window.localStorage.getItem(THEME_KEY);
    } catch (fehler) {
      wert = null;
    }
    return istTheme(wert) ? wert : null;
  }

  function speichereTheme(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (fehler) {
      /* localStorage kann blockiert sein – Demo läuft trotzdem weiter. */
    }
  }

  function ladeThemeAusConfig() {
    if (typeof window.fetch !== 'function') return;

    window.fetch(CONFIG_URL, { cache: 'no-store' })
      .then(function (antwort) {
        if (!antwort.ok) throw new Error('config.json nicht lesbar');
        return antwort.json();
      })
      .then(function (config) {
        if (!config || !istTheme(config.theme)) return;
        if (themeAusSpeicher() !== null) return;
        setzeTheme(config.theme);
      })
      .catch(function () {
        /* Ohne config.json (z. B. beim Öffnen per file://) bleibt das Standard-Theme aktiv. */
      });
  }

  /* ---------- Persistenz ---------- */

  function speichern() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (fehler) {
      /* localStorage kann blockiert sein – Demo läuft trotzdem weiter. */
    }
  }

  function laden() {
    var roh;
    try {
      roh = window.localStorage.getItem(STORAGE_KEY);
    } catch (fehler) {
      roh = null;
    }
    if (!roh) return false;

    try {
      var daten = JSON.parse(roh);
      if (!daten || typeof daten !== 'object') return false;
      state.noten = Array.isArray(daten.noten) ? daten.noten.filter(istNote).map(normalisiereNote) : [];
      state.klausuren = Array.isArray(daten.klausuren)
        ? daten.klausuren.filter(istKlausur).map(normalisiereKlausur)
        : [];
      return state.noten.length > 0 || state.klausuren.length > 0;
    } catch (fehler) {
      return false;
    }
  }

  function istNote(eintrag) {
    return eintrag && typeof eintrag.fach === 'string' && eintrag.fach.trim() !== '' &&
      isFinite(eintrag.note) && eintrag.note >= 1 && eintrag.note <= 6 &&
      isFinite(eintrag.gewicht) && eintrag.gewicht > 0;
  }

  function normalisiereNote(eintrag) {
    return {
      id: typeof eintrag.id === 'string' ? eintrag.id : id(),
      fach: String(eintrag.fach).trim().slice(0, 40),
      note: Number(eintrag.note),
      gewicht: Number(eintrag.gewicht)
    };
  }

  function istKlausur(eintrag) {
    return eintrag && typeof eintrag.fach === 'string' && eintrag.fach.trim() !== '' &&
      typeof eintrag.datum === 'string' && datumAusIso(eintrag.datum) !== null;
  }

  function normalisiereKlausur(eintrag) {
    return {
      id: typeof eintrag.id === 'string' ? eintrag.id : id(),
      fach: String(eintrag.fach).trim().slice(0, 40),
      datum: eintrag.datum
    };
  }

  function demoDaten() {
    var inDreiWochen = new Date(heuteOhneZeit().getTime() + 21 * MS_PRO_TAG);
    var inZehnTagen = new Date(heuteOhneZeit().getTime() + 10 * MS_PRO_TAG);

    state.noten = [
      { id: id(), fach: 'Mathematik', note: 2.0, gewicht: 2 },
      { id: id(), fach: 'Mathematik', note: 3.3, gewicht: 1 },
      { id: id(), fach: 'Deutsch', note: 2.7, gewicht: 2 },
      { id: id(), fach: 'Deutsch', note: 1.7, gewicht: 1 },
      { id: id(), fach: 'Englisch', note: 3.7, gewicht: 1 }
    ];
    state.klausuren = [
      { id: id(), fach: 'Mathematik', datum: isoAusDatum(inZehnTagen) },
      { id: id(), fach: 'Deutsch', datum: isoAusDatum(inDreiWochen) }
    ];
  }

  /* ---------- Rendering ---------- */

  function renderNoten() {
    el.notenListe.textContent = '';

    state.noten.forEach(function (eintrag) {
      var zeile = document.createElement('tr');

      var fachZelle = document.createElement('td');
      fachZelle.textContent = eintrag.fach;

      var noteZelle = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'badge';
      badge.dataset.stufe = stufeFuerNote(eintrag.note);
      badge.textContent = formatNote(eintrag.note);
      noteZelle.appendChild(badge);

      var gewichtZelle = document.createElement('td');
      gewichtZelle.textContent = '×' + eintrag.gewicht;

      var aktionZelle = document.createElement('td');
      var loeschen = document.createElement('button');
      loeschen.type = 'button';
      loeschen.className = 'btn-icon';
      loeschen.textContent = '✕';
      loeschen.setAttribute('aria-label', 'Note ' + formatNote(eintrag.note) + ' in ' + eintrag.fach + ' löschen');
      loeschen.addEventListener('click', function () {
        state.noten = state.noten.filter(function (kandidat) {
          return kandidat.id !== eintrag.id;
        });
        speichern();
        render();
      });
      aktionZelle.appendChild(loeschen);

      zeile.appendChild(fachZelle);
      zeile.appendChild(noteZelle);
      zeile.appendChild(gewichtZelle);
      zeile.appendChild(aktionZelle);
      el.notenListe.appendChild(zeile);
    });

    el.notenLeer.hidden = state.noten.length > 0;
  }

  function renderSchnitt() {
    var schnitt = gewichteterSchnitt(state.noten);

    if (schnitt === null) {
      el.schnitt.textContent = '–';
      el.schnitt.dataset.stufe = 'neutral';
      el.schnittText.textContent = 'Noch keine Noten erfasst.';
    } else {
      var stufe = stufeFuerNote(schnitt);
      el.schnitt.textContent = formatNote(schnitt);
      el.schnitt.dataset.stufe = stufe;
      el.schnittText.textContent = {
        gut: 'Stark! Weiter so.',
        mittel: 'Solide – mit etwas Übung geht mehr.',
        kritisch: 'Hier lohnt sich gezieltes Lernen.'
      }[stufe];
    }

    el.fachListe.textContent = '';
    faecher().forEach(function (fach) {
      var fachSchnitt = gewichteterSchnitt(notenFuerFach(fach));
      if (fachSchnitt === null) return;

      var eintrag = document.createElement('li');
      var name = document.createElement('span');
      name.textContent = fach;

      var badge = document.createElement('span');
      badge.className = 'badge';
      badge.dataset.stufe = stufeFuerNote(fachSchnitt);
      badge.textContent = formatNote(fachSchnitt);

      eintrag.appendChild(name);
      eintrag.appendChild(badge);
      el.fachListe.appendChild(eintrag);
    });
  }

  function renderZielFaecher() {
    var vorherigeAuswahl = el.zielFach.value;
    el.zielFach.textContent = '';

    var namen = faecher();
    if (namen.length === 0) {
      var leer = document.createElement('option');
      leer.value = '';
      leer.textContent = 'Kein Fach vorhanden';
      el.zielFach.appendChild(leer);
      return;
    }

    namen.forEach(function (fach) {
      var option = document.createElement('option');
      option.value = fach;
      option.textContent = fach;
      el.zielFach.appendChild(option);
    });

    if (namen.indexOf(vorherigeAuswahl) !== -1) {
      el.zielFach.value = vorherigeAuswahl;
    }
  }

  function renderKlausuren() {
    el.klausurListe.textContent = '';

    var sortiert = state.klausuren.slice().sort(function (a, b) {
      return a.datum.localeCompare(b.datum);
    });

    sortiert.forEach(function (klausur) {
      var tage = tageBis(klausur.datum);
      var eintrag = document.createElement('li');

      var info = document.createElement('span');
      info.textContent = klausur.fach + ' · ' + datumLesbar(klausur.datum);

      var badge = document.createElement('span');
      badge.className = 'badge';
      if (tage === null) {
        badge.textContent = 'unbekannt';
      } else if (tage < 0) {
        badge.textContent = 'vorbei';
      } else if (tage === 0) {
        badge.dataset.stufe = 'kritisch';
        badge.textContent = 'heute!';
      } else {
        badge.dataset.stufe = tage <= 7 ? 'kritisch' : (tage <= 14 ? 'mittel' : 'gut');
        badge.textContent = tage === 1 ? 'noch 1 Tag' : 'noch ' + tage + ' Tage';
      }

      var loeschen = document.createElement('button');
      loeschen.type = 'button';
      loeschen.className = 'btn-icon';
      loeschen.textContent = '✕';
      loeschen.setAttribute('aria-label', 'Klausur ' + klausur.fach + ' löschen');
      loeschen.addEventListener('click', function () {
        state.klausuren = state.klausuren.filter(function (kandidat) {
          return kandidat.id !== klausur.id;
        });
        speichern();
        render();
      });

      var rechts = document.createElement('span');
      rechts.appendChild(badge);
      rechts.appendChild(loeschen);

      eintrag.appendChild(info);
      eintrag.appendChild(rechts);
      el.klausurListe.appendChild(eintrag);
    });

    el.klausurLeer.hidden = sortiert.length > 0;
  }

  function render() {
    renderNoten();
    renderSchnitt();
    renderZielFaecher();
    renderKlausuren();
  }

  /* ---------- Events ---------- */

  el.notenForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var fach = el.fach.value.trim();
    var note = Number(el.note.value.replace(',', '.'));
    var gewicht = Number(el.gewicht.value);

    if (fach === '') {
      zeigeFehler(el.notenFehler, 'Bitte gib ein Fach an.');
      return;
    }
    if (!isFinite(note) || note < 1 || note > 6) {
      zeigeFehler(el.notenFehler, 'Die Note muss zwischen 1 und 6 liegen.');
      return;
    }
    if (!isFinite(gewicht) || gewicht <= 0) {
      zeigeFehler(el.notenFehler, 'Die Gewichtung muss größer als 0 sein.');
      return;
    }

    zeigeFehler(el.notenFehler, '');
    state.noten.push({ id: id(), fach: fach.slice(0, 40), note: note, gewicht: gewicht });
    speichern();
    render();

    el.note.value = '';
    el.fach.focus();
  });

  el.zielForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var fach = el.zielFach.value;
    var wunsch = Number(el.zielNote.value.replace(',', '.'));
    var gewicht = Number(el.zielGewicht.value);

    if (!fach) {
      el.zielErgebnis.dataset.stufe = 'mittel';
      el.zielErgebnis.textContent = 'Lege zuerst eine Note in einem Fach an.';
      return;
    }
    if (!isFinite(wunsch) || wunsch < 1 || wunsch > 6 || !isFinite(gewicht) || gewicht <= 0) {
      el.zielErgebnis.dataset.stufe = 'mittel';
      el.zielErgebnis.textContent = 'Bitte prüfe Wunschschnitt (1–6) und Gewichtung (> 0).';
      return;
    }

    var noetig = benoetigteNote(fach, wunsch, gewicht);

    if (noetig < 1) {
      el.zielErgebnis.dataset.stufe = 'kritisch';
      el.zielErgebnis.textContent = 'Ein Schnitt von ' + formatNote(wunsch) + ' in ' + fach +
        ' ist mit dieser Arbeit rechnerisch nicht mehr erreichbar (nötig wäre ' + formatNote(noetig) + ').';
      return;
    }
    if (noetig > 6) {
      el.zielErgebnis.dataset.stufe = 'gut';
      el.zielErgebnis.textContent = 'Entspann dich: Dein Ziel von ' + formatNote(wunsch) + ' in ' + fach +
        ' hältst du auch mit einer 6 in dieser Arbeit.';
      return;
    }

    el.zielErgebnis.dataset.stufe = stufeFuerNote(noetig);
    el.zielErgebnis.textContent = 'Du brauchst mindestens eine ' + formatNote(noetig) + ' in ' + fach +
      ', um auf einen Schnitt von ' + formatNote(wunsch) + ' zu kommen.';
  });

  el.klausurForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var fach = el.klausurFach.value.trim();
    var datum = el.klausurDatum.value;

    if (fach === '') {
      zeigeFehler(el.klausurFehler, 'Bitte gib ein Fach an.');
      return;
    }
    if (!datumAusIso(datum)) {
      zeigeFehler(el.klausurFehler, 'Bitte gib ein gültiges Datum an.');
      return;
    }

    zeigeFehler(el.klausurFehler, '');
    state.klausuren.push({ id: id(), fach: fach.slice(0, 40), datum: datum });
    speichern();
    render();

    el.klausurFach.value = '';
    el.klausurDatum.value = '';
  });

  el.themeToggle.addEventListener('click', function () {
    var neuesTheme = aktivesTheme() === 'dark' ? 'light' : 'dark';
    setzeTheme(neuesTheme);
    speichereTheme(neuesTheme);
  });

  el.resetBtn.addEventListener('click', function () {
    demoDaten();
    speichern();
    render();
  });

  /* ---------- Start ---------- */

  setzeTheme(themeAusSpeicher() || 'light');
  ladeThemeAusConfig();

  if (!laden()) {
    demoDaten();
    speichern();
  }
  el.klausurDatum.min = isoAusDatum(heuteOhneZeit());
  render();

  window.setInterval(renderKlausuren, 60 * 1000);
})();
