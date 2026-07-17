# Implementierungsplan: KraftRadar-CMS und sichere Inhaltsverwaltung (historisch)

> Dieser Plan dokumentiert die ursprüngliche CMS-Migration. Der aktuelle Produktionsstand verwendet Sveltia CMS unter `/admin/`; maßgeblich sind `ADMIN.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md` und `INDEXNOW.md`.

Stand: 15. Juli 2026

## 1. Erkannter aktueller Aufbau

- **Framework:** Astro 7.0.9 mit statischer Ausgabe und striktem TypeScript-Setup.
- **Paketmanager:** npm mit `package-lock.json`; Node.js ist über `>=22.12.0` festgelegt.
- **Hosting und Repository:** Git-Remote `DerBaum1337/Kraftradar`, laut Projektakte Cloudflare Pages aus `main`.
- **Öffentliche Routen:** Startseite, vier Kategorien, Über KraftRadar, Testmethode, Impressum, Datenschutz, 404 sowie fünf dynamisch erzeugte Artikelrouten.
- **Inhalte:** fünf Markdown-Dateien in `src/content/artikel/`; die Kategorie und der Dateiname bestimmen heute die Artikel-URL.
- **Darstellung:** gemeinsame Layouts (`Hauptlayout.astro`, `ArtikelLayout.astro`), wiederverwendbare Komponenten, globale CSS-Datei und eine dynamische Artikelroute.
- **SEO:** Canonical-URLs, Open Graph, Article- und Breadcrumb-JSON-LD, Sitemap und `robots.txt` sind vorhanden. RSS existiert noch nicht.
- **Sicherheit:** statische Sicherheitsheader in `public/_headers`; kein Adminbereich, keine OAuth-Anbindung, kein Worker und keine Datenbank.
- **Tests:** bisher keine automatisierten Tests oder Content-Prüfungen.
- **Medien:** vier lokale JPEGs unter `public/images/artikel/`; bisher kein Upload-Ordner oder Medien-Workflow.

## 2. Geplante Zielarchitektur

Die bestehende Astro-Seite bleibt ein überwiegend statischer Generator. Es gibt keine Datenbank, keine öffentliche Schreib-API und keine eigene Benutzerverwaltung.

```text
Markdown/Frontmatter in Git
        │
        ├── Astro Content Collections → statische öffentliche Seiten, Sitemap, RSS
        │
        └── Decap CMS unter /admin/ → GitHub-Backend → Pull Request/Commit → Cloudflare Pages Build

Cloudflare Access schützt /admin/* zusätzlich.
Ein separater Cloudflare Worker übernimmt ausschließlich den GitHub-OAuth-Callback.
```

Kernentscheidungen:

1. Artikel werden in `src/content/articles/<kategorie>/<slug>.md` abgelegt. Der `slug` steht explizit im Frontmatter, damit eine Verschiebung nie URLs verändert.
2. Ein zod-validiertes Artikelmodell enthält Status, SEO, Autor, Bilder, Quellen, Transparenz, verwandte Artikel und optionale Produkttestdaten.
3. Nur `status: published`, nicht zukünftige und nicht mit `noindex: true` markierte Artikel werden öffentlich gerendert, in Sitemap/RSS aufgenommen oder als verwandte Artikel verlinkt.
4. Allgemeine redaktionelle Inhalte liegen als editierbare Konfigurationsdateien in einer eigenen Content Collection. Rechtliche Texte bleiben zunächst bewusst außerhalb des CMS, damit sie nicht versehentlich ohne rechtliche Prüfung verändert werden.
5. Decap CMS 3.11.0 wird versionsfest nur auf `/admin/` geladen. Der lokale Modus verwendet den offiziellen Decap-Proxy und ist vom Produktions-Workflow getrennt.
6. Der GitHub-Zugriff wird über einen vorbereiteten, separaten Cloudflare OAuth Worker mit OAuth-State, PKCE und serverseitigen Secrets realisiert. Die tatsächlichen Secrets und Cloudflare-/GitHub-Einstellungen werden nie im Repository gespeichert.

## 3. Betroffene Dateien und Bereiche

### Bestehende Dateien, die angepasst werden

- `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.example`
- `src/content.config.ts`, `src/lib/artikel.ts`
- `src/pages/[bereich]/[slug].astro`, `src/pages/sitemap.xml.ts`
- Artikel- und Hauptlayouts sowie Artikel-/Kategorie-Komponenten
- Kategorien- und allgemeine Seitentemplates
- `public/_headers`, `public/robots.txt`

### Neue zentrale Bereiche

- `src/content/articles/`, `src/content/pages/`, `src/content/authors/`, `src/content/settings/`
- `public/admin/index.html`, `public/admin/config.yml`, `public/admin/admin.css`, `public/admin/admin.js`
- `public/uploads/articles/`
- `workers/decap-oauth/` für den nicht automatisch aktivierten OAuth Worker
- `scripts/` für Inhalts-, Link- und URL-Validierung
- `tests/` für Route-, Content- und Admin-Smoke-Tests
- `backups/` für die URL- und Inhaltsbestandsaufnahme
- `README.md`, `ADMIN.md`, `DEPLOYMENT.md`, `MIGRATION.md`, `ARCHITECTURE.md`

## 4. Migrationsreihenfolge

1. **Phase 1 – Bestandsaufnahme und Sicherung:** URL-Snapshot, Baseline-Build und dokumentierter Git-Rückfallpunkt.
2. **Phase 2 – Inhaltsmodell und Artikelmigration:** neues validiertes Schema, Autorenmodell, Artikel in die neue Ablage verschieben, URLs anhand des expliziten Slugs erhalten.
3. **Phase 3 – Öffentliche Seitengenerierung:** dynamische Routen, Kategorien, Canonicals, Sitemap, RSS, Lesedauer und verwandte Artikel auf das neue Modell umstellen.
4. **Phase 4 – CMS-Integration:** Decap-Konfiguration, deutsche Felder, Medienablage, lokale CMS-Nutzung und Basisvorschau.
5. **Phase 5 – Authentifizierung und Cloudflare-Vorbereitung:** Worker-Quellcode, eng gefasste Header, Access-/GitHub-/Worker-Anleitung und Secret-Platzhalter.
6. **Phase 6 – Tests und Dokumentation:** Content-, Link- und Routentests sowie Bedien- und Deployment-Dokumentation.

Vor jeder Entfernung oder Verschiebung wird die vorhandene öffentliche URL-Liste mit der neuen Build-Ausgabe verglichen. Das Git-Commit `870ca6d` ist der technische Rückfallpunkt vor dieser Migration.

## 5. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
| --- | --- |
| URL-Verlust durch neue Ordnerstruktur | explizites `slug`-Feld, URL-Snapshot und Routentest vor/nach Migration |
| Unbeabsichtigt sichtbare Entwürfe | Veröffentlichung nur bei `status: published`, Datum <= heute und `noindex: false`; Prüfung in Sitemap, RSS und Tests |
| Beschädigte Markdown-/HTML-Bausteine | Migration ohne Textkürzungen, erlaubte HTML-Prüfung, Build- und Linktest |
| Secrets im Repository | `.env.example` nur Platzhalter, Worker-Secrets ausschließlich in Cloudflare, Secret-Scan im Testlauf |
| OAuth- oder Access-Fehlkonfiguration | Worker wird erst nach manueller Secret-/Domain-Konfiguration aktiv; detaillierte Checkliste und eingeschränkte Callback-Route |
| CMS-CDN wird von CSP blockiert | eigener, enger `/admin/*`-Header; öffentliche CSP bleibt unverändert restriktiv |
| Rechtsseiten versehentlich verändert | Impressum und Datenschutz bleiben zunächst statisch und nicht als Standard-CMS-Inhalt verfügbar |
| Vorschau-Deployments veröffentlichen persönliche Entwürfe | dokumentierte Cloudflare-Access-Regel für Vorschau-Branches; kein öffentliches Preview-Versprechen ohne diese Konfiguration |

## 6. Bewusst zurückgestellte Funktionen

- öffentliche Benutzerkonten, Kommentare, Newsletter, Shop, Zahlungen und Tracking
- Datenbank, Mediendatenbank, Drag-and-drop-Page-Builder und eigene Passwortverwaltung
- automatische Bildtranskodierung im Browser oder auf einer kostenpflichtigen Plattform
- automatische Social-Media-Veröffentlichung, KI-Textfunktionen und rechtliche/medizinische Automatisierung
- vollständige visuelle CMS-Vorschau mit allen Astro-Komponenten; zunächst gibt es eine zuverlässige Markdown-Basisvorschau und Cloudflare-Preview-Deployments
- rechtliche Seitenbearbeitung im CMS, bis ein gesonderter rechtlicher Freigabeprozess definiert ist
