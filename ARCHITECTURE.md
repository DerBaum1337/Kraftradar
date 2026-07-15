# Architektur

## Öffentliche Website

Astro erstellt ausschließlich statische öffentliche Dateien. Die Seiten laden keinen CMS-Code und keine Datenbank. Artikel werden aus `src/content/articles/` gelesen und nur dann veröffentlicht, wenn alle drei Bedingungen gelten:

1. `status: published`
2. ein Veröffentlichungsdatum vorhanden und nicht in der Zukunft ist
3. der Artikel nicht mit `noindex: true` markiert ist (für Sitemap, RSS und Empfehlungen)

`noindex`-Artikel können bewusst erreichbar sein, werden aber nicht in Sitemap, RSS oder verwandten Artikeln vorgeschlagen. Entwürfe, Review- und Ready-Artikel werden nie als öffentliche Artikelroute erzeugt.

## Datenfluss

```text
Decap CMS -> GitHub-Commit oder Pull Request -> Cloudflare Pages Build -> statische Website
Markdown -> Content Collection + Schema -> Artikel, Kategorien, Sitemap, RSS
```

Die Kategorie und der explizite `slug` bilden die URL: `/<category>/<slug>/`. Der Ordnername darf deshalb nie als alleinige URL-Quelle verwendet werden.

## Admin und Sicherheit

`/admin/` ist eine statische Decap-Oberfläche. Sie erhält keine Navigation, `robots.txt` verbietet Crawling und `_headers` setzt `X-Robots-Tag: noindex, nofollow`. Das ist kein Zugriffsschutz.

Cloudflare Access schützt später `/admin/*` für die explizit freigegebene E-Mail-Adresse. Für die GitHub-Schreibberechtigung nutzt Decap einen separaten OAuth-Worker. Der Worker speichert GitHub-Secret, OAuth-State-Secret und erlaubten Ursprung ausschließlich als Cloudflare-Secrets. Er nutzt signierten kurzlebigen State, PKCE, eine HttpOnly-Cookiebindung und eine feste `postMessage`-Zielorigin.

Cloudflare Access und GitHub OAuth sind getrennte Schutzschichten: Access kontrolliert den Aufruf des Editors; GitHub entscheidet über Schreibrechte im Repository.

## Bewusst nicht eingesetzt

Keine Datenbank, keine eigene Passwortverwaltung, keine öffentliche Schreib-API, keine Leseraccounts, keine Tracker, kein Page Builder und kein clientseitiges Rendering öffentlicher Artikel.
