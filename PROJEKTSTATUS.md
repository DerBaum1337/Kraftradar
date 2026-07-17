# KraftRadar – Projektakte für ChatGPT

Stand: 17. Juli 2026
Projektpfad: `C:\Users\User\kraftradar`  
Live-Domain: https://kraftradar.de  
GitHub: https://github.com/DerBaum1337/Kraftradar  
Hosting: Cloudflare Pages, automatisch aus dem Branch `main`

## 1. Projektziel

**KraftRadar** ist eine deutschsprachige, unabhängige Fitness- und Testplattform. Die Website soll verständliche Inhalte zu Training, Supplements, Gym-Zubehör und dem persönlichen Trainingsweg bündeln.

Die Marke steht für:

- ehrliche Erfahrungen statt Herstellerwerbung;
- klare Vor- und Nachteile;
- nachvollziehbare Bewertungskriterien;
- Preis-Leistung als festen Bestandteil von Tests;
- persönliche Fortschritte ohne Hochglanzfilter;
- einen ruhigen, technischen und seriösen Auftritt.

KraftRadar ist kein Supplement-Shop und soll nicht wie eine aggressive Bodybuilding- oder Affiliate-Seite wirken. Affiliate-Links, Werbung und Tracking sind derzeit **nicht** aktiv.

## Inhaltsleitlinie

Neue Inhalte folgen diesen verbindlichen Regeln:

- persönliche Ich-Perspektive und konkrete eigene Erfahrungen statt Werbesprache;
- sachlich, verständlich und ruhig schreiben – ohne erfundene Eindrücke oder Superlative;
- persönliche Details nur nennen, wenn sie für den Artikel wirklich erforderlich sind;
- medizinische Themen nicht unnötig ausbreiten;
- eigene Erfahrungen klar von allgemeinen Fakten trennen und Fakten zu EGYM, Supplements oder Training mit Quellen belegen;
- keine Artikel nur für Suchmaschinen schreiben.

Die geplante Veröffentlichungsreihenfolge lautet: EGYM für Anfänger, EGYM-Gewichte verstehen, Whey- oder Kreatin-Erfahrungsbericht, Gym-Zubehör, nächster Fortschrittsbericht.

## 2. Aktuelle Designrichtung

Die visuelle Richtung heißt intern **„Dark Performance + Radar“**:

- sehr dunkler Hintergrund;
- helle, gut lesbare Schrift;
- Radargrün als sparsame Akzentfarbe;
- technische Radar-Grafik als Wiedererkennungsmerkmal;
- ruhige Karten, feine Rahmen und viel Abstand;
- keine rot-schwarze Hardcore-Bodybuilding-Optik;
- keine überladenen Animationen.

Wichtige CSS-Farben befinden sich in `src/styles/global.css`:

- Hintergrund: `#0b0f14`
- Flächen: `#111720` und `#18212c`
- Text: `#f5f7fa`
- gedämpfter Text: `#aeb8c5`
- Akzent: `#55e6a5`

Das Grunddesign gilt als fertig. Künftige Arbeit soll sich auf Inhalte, Komponenten und Funktionen konzentrieren, nicht auf ein neues Redesign.

## 3. Technischer Stack

- **Astro 7** als statischer Site-Generator
- reines Astro, kein React, Vue oder anderes Frontend-Framework
- eine globale CSS-Datei, keine externe UI-Bibliothek
- Cloudflare Pages für Deployment, CDN, HTTPS und DNS
- GitHub-Repository für Versionsverwaltung und automatisierte Veröffentlichung
- Markdown-basierte Astro Content Collections für neue Artikel
- Sveltia CMS unter `/admin/`, fest gepinnt auf `@sveltia/cms@0.171.0`
- Sveltia speichert nach erfolgreichem GitHub-OAuth-Login direkt nach `main`; `draft`, `review` und `ready` bleiben privat, nur `published` wird gebaut

> **Aktueller Betriebshinweis:** Ältere Abschnitte dieses Dokuments beschreiben die ursprüngliche Decap-Migration. Der produktive Admin ist inzwischen vollständig auf Sveltia umgestellt; die aktuellen Arbeitsabläufe stehen in `ADMIN.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md` und `INDEXNOW.md`.

Wichtige Eigenschaften:

- statisch erzeugte HTML-Seiten;
- kein JavaScript-Bundle für Besucher, nur ein kleines eingebautes Skript für das mobile Menü;
- keine extern geladenen Fonts;
- keine Analyse-, Marketing- oder Social-Media-Skripte;
- keine Datenbank und keine Benutzerkonten.

## 4. Projektstruktur

```text
src/
├── components/
│   ├── Artikelkarte.astro
│   ├── Bereichsbeitraege.astro
│   ├── Bewertungsbox.astro
│   ├── Breadcrumbs.astro
│   ├── Footer.astro
│   ├── Header.astro
│   ├── KategorieIcon.astro
│   ├── Markenlogo.astro
│   ├── Produktdaten.astro
│   ├── RadarVisual.astro
│   ├── Seitenkopf.astro
│   ├── Themenkarte.astro
│   ├── Transparenzhinweis.astro
│   ├── Vertrauensleiste.astro
│   └── VorNachteile.astro
├── content/
│   └── artikel/
│       └── fortschritt-dokumentieren.md
├── layouts/
│   ├── ArtikelLayout.astro
│   └── Hauptlayout.astro
├── lib/
│   └── artikel.ts
├── pages/
│   ├── [bereich]/[slug].astro
│   ├── 404.astro
│   ├── datenschutz.astro
│   ├── gym-zubehoer.astro
│   ├── impressum.astro
│   ├── index.astro
│   ├── mein-weg.astro
│   ├── supplements.astro
│   ├── testmethode.astro
│   ├── training.astro
│   ├── ueber-kraftradar.astro
│   └── sitemap.xml.ts
├── styles/
│   └── global.css
├── templates/
│   ├── artikel.md
│   ├── mein-weg-update.md
│   └── produkt-test.md
└── content.config.ts

public/
├── _headers
├── favicon.ico
├── favicon.svg
├── og-kraftradar.png
├── og-kraftradar.svg
└── robots.txt
```

## 5. Bereits umgesetzt

### Grundgerüst und Gestaltung

- globales Hauptlayout mit Header, Footer und `<main>`;
- einheitliche Navigation mit aktivem Menüpunkt;
- wiederverwendbares Markenlogo und Radar-Visual;
- responsive Startseite mit Hero, Buttons, Vertrauensleiste, Themenkarten, aktuellen Inhalten und „Mein Weg“-Teaser;
- mobile Navigation mit Menübutton;
- Fokus-Stile für Tastaturbedienung;
- Skip-Link zum Hauptinhalt;
- Unterstützung für reduzierte Animationen;
- eigenständige 404-Seite;
- mobile Anpassungen für 320, 360, 390 und 430 Pixel Breite geprüft;
- Radar-Beschriftung auf kleinen Geräten so verschoben, dass „Zubehör“ nicht mehr vom Scan-Feld verdeckt wird.

### Hauptseiten

Folgende Seiten existieren und verwenden dasselbe Layout:

- `/` – Startseite
- `/training/` – allgemeines Training
- `/supplements/` – Supplements
- `/gym-zubehoer/` – Gym-Zubehör
- `/mein-weg/` – persönliche Entwicklung
- `/ueber-kraftradar/` – Projektidee und Haltung
- `/testmethode/` – Kriterien und Transparenz
- `/training/fortschritt-dokumentieren/` – erster Trainingsartikel
- `/impressum/` – lokales Impressum
- `/datenschutz/` – lokale Datenschutzerklärung

Die Übersichtsseiten enthalten Themenkarten. Noch nicht vorhandene Bereiche sind deutlich mit „In Vorbereitung“ gekennzeichnet und führen nicht auf leere Seiten.

### Rechtliches und Datenschutz

- lokales Impressum unter `/impressum/`;
- lokaler Datenschutz unter `/datenschutz/`;
- Impressums- und Datenschutzlinks im Footer jeder Seite;
- Kontaktweg über den verwendeten Online-Impressum-Service;
- Angaben zur redaktionellen Verantwortung nach § 18 Abs. 2 MStV im Impressum;
- Datenschutztext passend zum aktuellen Stand ohne Tracking, Affiliate-Links, Kontaktformular, Newsletter und externe Einbettungen;
- beide Rechtsseiten tragen `noindex, nofollow` und sind nicht Teil der Sitemap.

Wichtig: Rechtliche Texte müssen aktualisiert werden, bevor Tracking, Affiliate-Links, Werbung, Newsletter, Formulare, Videos, Google Maps oder andere externe Dienste eingebaut werden. Diese Projektakte ersetzt keine Rechtsberatung.

### SEO und Vorschau

- individuelle Seitentitel und Meta-Beschreibungen;
- Canonical-URLs auf `https://kraftradar.de`;
- Open-Graph- und Twitter-Metadaten;
- eigenes 1200×630-Open-Graph-Bild;
- Favicon;
- generisches `WebPage`-Schema;
- `Article`-Schema für Content-Collection-Artikel;
- Artikel-Open-Graph-Daten mit Typ `article`, Datum und Autor;
- Breadcrumb-Navigation für Artikel;
- `robots.txt` mit Sitemap-Verweis;
- Sitemap unter `/sitemap.xml`;
- Artikel aus der Content Collection werden automatisch in die Sitemap übernommen;
- Rechtsseiten werden nicht in die Sitemap aufgenommen.

### Performance und Sicherheit

Die aktuelle Website ist sehr schlank:

- Startseiten-HTML etwa 13 kB;
- CSS etwa 19 kB;
- kein JavaScript-Bundle;
- keine externen Schriftarten, Tracker oder eingebetteten Medien;
- Cloudflare liefert komprimiert aus;
- Open-Graph-Bild etwa 104 kB und nur für Link-Vorschauen relevant.

In `public/_headers` sind zusätzlich konfiguriert:

- `Strict-Transport-Security`;
- `X-Frame-Options: DENY` gegen Einbettung in fremde Frames;
- `X-Content-Type-Options: nosniff`;
- restriktive `Permissions-Policy`;
- `Referrer-Policy`;
- langfristiges, unveränderliches Browser-Caching für gehashte Dateien in `/_astro/`.

## 6. Inhaltsverwaltung ab jetzt

Neue veröffentlichte Artikel werden als Markdown-Dateien in `src/content/artikel/` angelegt.

Jeder Artikel hat mindestens diese Frontmatter-Daten:

```yaml
title: Titel des Artikels
description: Kurze, konkrete Zusammenfassung
category: training | supplements | gym-zubehoer | mein-weg
categoryLabel: Training · Grundlagen
publishedAt: YYYY-MM-DD
author: Sebastian Trost
estimatedReadingMinutes: 5
kind: artikel | supplement-test | zubehoer-test | mein-weg-update
image: /bilder/dein-bild.webp
imageAlt: Kurze, konkrete Bildbeschreibung
ogImage: /bilder/social/dein-artikel.webp
draft: false
```

Regeln:

- `draft: true` veröffentlicht den Artikel nicht und nimmt ihn nicht in Sitemap oder Übersichten auf.
- Der Dateiname wird zur URL. `mein-erster-test.md` in der Kategorie `supplements` wird zu `/supplements/mein-erster-test/`.
- Artikel werden beim Build geprüft. Fehlende oder falsche Metadaten führen zu einem Buildfehler statt zu einer kaputten Live-Seite.
- Veröffentlichte Artikel erscheinen automatisch auf der Startseite und auf der passenden Bereichsseite.
- Filterung, Ausschluss von Entwürfen und Sortierung nach Datum liegen zentral in `src/lib/artikel.ts`; Startseite, Bereichsseiten, Sitemap und dynamische Artikelrouten verwenden dieselben Regeln.
- Produkttests können zusätzlich strukturierte Metadaten für Transparenz, Produktdaten, Vorteile, Nachteile, Einzelbewertungen und Gesamtnote enthalten. Das Artikellayout zeigt daraus automatisch die passenden Komponenten an.
- Vorlagen befinden sich in `src/templates/`.

Die erste Collection-Datei ist `src/content/artikel/fortschritt-dokumentieren.md`. Der bisherige Artikel wurde dorthin migriert; seine URL blieb unverändert.

## 7. Verbindlicher Ablauf für Produkttests

Vor dem ersten benoteten Test muss die Testmethode weiter konkretisiert werden:

- Bewertungsskala, zum Beispiel 0 bis 10;
- Gewichtung einzelner Kriterien;
- Mindest-Testdauer;
- Testdatum;
- Preisdatum und Umgang mit Preisänderungen;
- Kennzeichnung „selbst gekauft“ oder „kostenlos erhalten“;
- Kennzeichnung von Affiliate-Links und bezahlten Kooperationen;
- klare Trennung zwischen subjektivem Eindruck und überprüfbarer Produktangabe;
- Vorteile, Nachteile und nachvollziehbares Fazit.

Für Supplements sind vorgesehen:

- Geschmack;
- Löslichkeit;
- Zutaten;
- Nährwerte;
- Verpackung;
- Preis pro Portion;
- Preis pro 25 Gramm Protein, wenn passend.

Für Gym-Zubehör sind vorgesehen:

- Verarbeitung;
- Komfort;
- Haltbarkeit;
- praktische Nutzung;
- Preis-Leistung;
- Vorteile und Nachteile.

## 8. Inhaltliche Trennung der Bereiche

### Training

Allgemeine, hilfreiche Inhalte:

- Trainingsgrundlagen;
- Krafttraining;
- Geräte und Technik;
- Ausdauer;
- Regeneration;
- Dokumentation als allgemeiner Ratgeber.

### Supplements

- Whey und Proteinpulver;
- Kreatin;
- Omega-3;
- Magnesium;
- Vitamine;
- Produktvergleiche;
- später Preisrechner.

### Gym-Zubehör

- Trainingsschuhe;
- Fitnessuhren;
- Kopfhörer;
- Taschen und Rucksäcke;
- Shaker und Trinkflaschen;
- Griffe und Zughilfen.

### Mein Weg

Nur persönliche Entwicklung:

- Ausgangslage und Ziele;
- aktuelles Training;
- Kraftwerte und Fortschritte;
- Fehler und Rückschläge;
- regelmäßige Updates.

Keine Medikamentendaten, fremden Daten oder unnötig privaten Körperdaten veröffentlichen. Persönliche Gesundheitsinformationen wie ADHS oder ARFID erscheinen nur, wenn Sebastian sie bewusst, knapp und im eigenen Kontext freigegeben hat.

## 9. Nächste Entwicklungsprioritäten

### Priorität 1 – erste echte Inhalte

Zuerst vier hochwertige Beiträge erstellen:

1. ein allgemeiner Trainingsartikel;
2. ein ausführlicher Supplement-Test;
3. ein Zubehör-Test;
4. ein persönliches „Mein Weg“-Update.

Jeder Beitrag soll eigene Erfahrungen, klare Grenzen, Datum, Quellen bei Fakten und später eigene Bilder enthalten.

### Bereits vorhandene Testbausteine

Für spätere Tests stehen als wiederverwendbare Astro-Komponenten bereit:

- Transparenzhinweis;
- Produktdaten;
- Vorteile-/Nachteile-Box;
- Bewertungsbox mit Gewichtung und sichtbaren Balken;
- Breadcrumb-Navigation.

### Priorität 2 – Testbausteine in den ersten Produkttest integrieren

Noch zu bauen:

- Preisübersicht;
- Fortschrittskarte;
- Vergleichstabelle;
- Artikelübersicht mit Filtermöglichkeit.

### Priorität 3 – SEO-Ausbau nach den ersten Artikeln

- Google Search Console einrichten;
- Sitemap einreichen;
- Veröffentlichungs- und Aktualisierungsdaten nutzen;
- Bild-Alt-Texte konsequent pflegen;
- interne Links zwischen Artikeln setzen;
- Artikel- und später Produkt-Schema ergänzen;
- Breadcrumbs ergänzen.

### Priorität 4 – besondere Programmierfunktionen

Als erstes:

- Proteinpreis-Rechner mit Packungspreis, Packungsgröße, Proteinanteil und Portionsgröße;
- Ergebnis: Preis pro 100 Gramm, pro Portion und pro 25 Gramm Protein.

Später:

- Produktfilter;
- Sortierung;
- Produktvergleich;
- Fortschrittsdiagramme;
- Vergleichslisten.

## 10. Dinge, die bewusst noch warten

- Affiliate-Links;
- Werbung;
- Analytics;
- Newsletter;
- Kontaktformular auf KraftRadar;
- Nutzerkonten;
- Kommentare;
- Datenbank;
- Suchfunktion;
- YouTube-, TikTok- oder Instagram-Einbettungen;
- Dark-/Light-Mode;
- große Animationen;
- mehrere Sprachen.

## 11. Manuelle Aufgaben außerhalb des Repositories

Diese Punkte können nicht allein per Git-Commit erledigt werden, weil sie Zugriff auf externe Konten benötigen.

### Cloudflare: www-Weiterleitung

`www.kraftradar.de` ist noch nicht zuverlässig als eigene Domain eingerichtet. In Cloudflare soll später:

1. ein DNS-Eintrag für `www` angelegt werden;
2. `www.kraftradar.de` als Custom Domain mit Cloudflare Pages verbunden werden;
3. eine permanente 301-Weiterleitung von `www.kraftradar.de/*` auf `https://kraftradar.de/$1` eingerichtet werden.

Die bevorzugte Domain bleibt ohne `www`.

### Google Search Console

Nach den ersten echten Inhalten:

1. Property für `kraftradar.de` anlegen;
2. Domain per DNS-Eintrag bestätigen;
3. `https://kraftradar.de/sitemap.xml` einreichen;
4. Indexierung und mögliche Probleme regelmäßig prüfen.

## 12. Lokaler Entwicklungsablauf

### Entwicklung starten

Im Projektordner:

```powershell
npm.cmd run dev
```

Danach: http://localhost:4321/

Das Terminal während der Entwicklung geöffnet lassen. Änderungen werden normalerweise automatisch aktualisiert.

### Vor einer Veröffentlichung prüfen

```powershell
npm.cmd run build
```

Der Build muss ohne Fehler enden. Zusätzlich prüfen:

- Startseite und alle Hauptseiten;
- mobile Darstellung;
- keine horizontale Scrollleiste;
- Buttons und Navigation;
- 404-Seite;
- Impressum und Datenschutz;
- Sitemap.

### Änderungen veröffentlichen

```powershell
git status
git add .
git commit -m "Kurze Beschreibung der Änderung"
git push origin main
```

Cloudflare Pages erstellt danach automatisch ein neues Deployment. In Cloudflare unter **Workers & Pages → KraftRadar → Deployments** prüfen, ob der neueste Commit erfolgreich veröffentlicht wurde.

## 13. Bisherige wichtige Git-Commits

- `c67562a` – Startseite und SEO-Grundlage
- `b1622e1` – globales Layout, mobile Gestaltung und Branding
- `a4b48d3` – mobile Lesbarkeit
- `ea73af6` – Kategorien als Übersichtsseiten
- `a6ee78a` – mobiles Menü und Impressum-Redirect
- `54f6059` – zugängliches mobiles Menü
- `b46371e` – lokales Impressum
- `ec44dbf` – Datenschutzerklärung
- `1c63011` – redaktionelle Verantwortlichkeit im Impressum
- `dffd994` – Datenschutzdetails und mobile Radar-Korrektur
- `cd36f65` – Content Collections, Artikellayout, Sitemap und Security-Header

## 14. Aktuelle Qualitätsbewertung

Die Grundlage ist stabil und bereit für echte Inhalte:

- Design und Wiedererkennung: stark;
- mobile Darstellung: gut;
- Performance: sehr gut;
- technische SEO-Basis: gut;
- Barrierefreiheit: gute Basis;
- Sicherheitsbasis: gut für eine statische Website;
- Inhaltsmenge: noch gering und daher höchste nächste Priorität.

Der wichtigste Grundsatz für die nächsten Schritte lautet: **Nicht weiter am Grunddesign feilen, sondern wenige echte, hochwertige Inhalte und wiederverwendbare Testbausteine aufbauen.**
