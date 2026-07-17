# KraftRadar

KraftRadar ist eine statische Astro-Website für persönliche Trainingserfahrungen, nachvollziehbare EGYM-Erklärungen und spätere Produktbewertungen. Öffentliche Inhalte werden aus versionierten Markdown-Dateien erzeugt.

## Technik

- Astro 7 mit statischem Produktionsbuild
- Astro Content Collections mit Zod-Validierung
- Markdown für Artikel, Autoren und editierbare Seitendaten
- Sveltia CMS unter `/admin/` (nicht in Navigation oder Sitemap)
- GitHub als Inhaltsversionsspeicher
- Cloudflare Pages für die öffentliche Auslieferung
- produktiver Cloudflare Worker für den GitHub-OAuth-Callback

## Voraussetzungen

- Node.js 22.12 oder neuer
- npm

## Lokale Befehle

```bash
npm install
npm run dev
npm run build
npm run preview
npm run typecheck
npm run validate:content
npm run test
npm run test:routes
npm run check:links
npm run check:secrets
npm run indexnow -- --sitemap
```

`/admin/` ist über Cloudflare Access geschützt. Sveltia speichert Änderungen nach erfolgreichem GitHub-OAuth-Login direkt in `main`; die Sichtbarkeit steuert das Frontmatter-Feld `status`. Nur `published` wird öffentlich gebaut. Den IndexNow-Befehl nur bewusst nach einem erfolgreichen Produktionsdeployment ausführen; Details stehen in [INDEXNOW.md](INDEXNOW.md).

## Inhalt

- Artikel: `src/content/articles/<kategorie>/<slug>.md`
- Autoren: `src/content/authors/`
- editierbare Seitentitel und SEO-Daten: `src/content/pages/`
- öffentliche Bilder: `public/uploads/articles/`

Weitere Informationen stehen in [ARCHITECTURE.md](ARCHITECTURE.md), [ADMIN.md](ADMIN.md), [DEPLOYMENT.md](DEPLOYMENT.md) und [MIGRATION.md](MIGRATION.md).
