# Inhaltsmigration und Rückfallplan

## Ausgangslage

Vor der Migration lagen fünf Artikel in `src/content/artikel/`. Der URL-Snapshot liegt in `backups/public-urls-before-cms.json`, die unveränderten Originaldateien in `backups/legacy-content-artikel/`.

## Neue Ablage

| Öffentliche URL | Neue Quelldatei |
| --- | --- |
| `/training/fortschritt-dokumentieren/` | `src/content/articles/training/fortschritt-dokumentieren.md` |
| `/training/egym-fuer-anfaenger-so-laeuft-mein-training-ab/` | `src/content/articles/training/egym-fuer-anfaenger-so-laeuft-mein-training-ab.md` |
| `/training/egym-gewichte-verstehen/` | `src/content/articles/training/egym-gewichte-verstehen.md` |
| `/mein-weg/vom-unsportlichen-raucher-zum-regelmaessigen-training/` | `src/content/articles/mein-weg/vom-unsportlichen-raucher-zum-regelmaessigen-training.md` |
| `/mein-weg/acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte/` | `src/content/articles/mein-weg/acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte.md` |

Die Migration kopiert den Artikeltext unverändert und ergänzt lediglich das validierte Frontmatter. Der explizite Slug erhält die vorhandenen URLs.

## Prüfung

`npm run test:routes` vergleicht den Snapshot mit dem Produktionsbuild. Jede frühere URL muss mit einer Seite, genau einer H1 und einem Canonical vorhanden sein. `npm run check:links` prüft interne Links und lokale Assets.

## Rückfall

1. Den letzten bekannten funktionierenden Commit vor der Migration (`870ca6d`) in GitHub vergleichen.
2. Bei einem akuten Fehler den fehlerhaften Produktionscommit per Revert rückgängig machen.
3. Die Originalinhalte aus `backups/legacy-content-artikel/` wiederherstellen, falls eine manuelle Korrektur nötig ist.
4. Erst nach `build`, Route- und Linktest erneut veröffentlichen.
