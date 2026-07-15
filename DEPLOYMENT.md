# Deployment und manuelle Cloudflare-Schritte

## Cloudflare Pages

- Repository: `<DEIN_GITHUB_BENUTZERNAME>/<DEIN_REPOSITORY>`
- Produktionsbranch: `main`
- Build-Befehl: `npm run build`
- Ausgabeordner: `dist`
- Node-Version: mindestens 22.12
- Custom Domain: `kraftradar.de`

Jeder Merge in `main` löst den normalen Produktionsbuild aus. Git-basierte CMS-Veröffentlichungen benötigen keine zweite Deploy-Technik.

## GitHub OAuth App

1. GitHub: **Settings -> Developer settings -> OAuth Apps -> New OAuth App**.
2. Homepage URL: `https://kraftradar.de`.
3. Authorization callback URL: `https://auth.kraftradar.de/callback`.
4. Client-ID notieren und Client-Secret erzeugen.
5. Niemals Client-Secret in Git, Decap-Konfiguration oder Browser eintragen.

## OAuth Worker

1. In `workers/decap-oauth/wrangler.toml` die Worker-Route oder Custom Domain für `auth.kraftradar.de` im Cloudflare-Konto einrichten.
2. Worker deployen.
3. Secrets ausschließlich im Worker setzen:

```bash
wrangler secret put GITHUB_OAUTH_CLIENT_ID
wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
wrangler secret put OAUTH_STATE_SECRET
wrangler secret put ALLOWED_ORIGIN
```

`ALLOWED_ORIGIN` ist exakt `https://kraftradar.de`. Für lokale Tests wird ein separater lokaler Worker bzw. eine sichere Testkonfiguration benötigt; niemals die Produktionssecrets in lokale Dateien kopieren.

4. In `public/admin/config.yml` `repo`, `base_url` und `auth_endpoint` nur dann auf die echte Domain setzen, wenn die Route funktioniert.
5. Der Worker darf nur `/auth` und `/callback` bedienen. Keine Tokens loggen. Der Callback validiert State und PKCE serverseitig.

## Cloudflare Access

1. Zero Trust -> Access -> Applications -> Add application -> Self-hosted.
2. Domain: `kraftradar.de`, Pfad: `/admin/*`.
3. Policy: **Allow**, Include: die konkrete Adresse `<DEINE_ERLAUBTE_EMAIL>`.
4. Session-Dauer kurz und angemessen setzen; keine offene Registrierungsregel anlegen.
5. `/callback` auf `auth.kraftradar.de` nicht pauschal unter diese Access-Regel legen. Falls er geschützt wird, muss nur diese Callback-Route gezielt ausgenommen werden, da GitHub den OAuth-Callback sonst nicht zustellen kann.
6. Für Pages-Vorschau-Deployments eine gleich enge Access-Anwendung konfigurieren, bevor Entwürfe mit persönlichen Informationen dort geprüft werden.

Access ist kein Ersatz für GitHub-Berechtigungen; der OAuth-Login benötigt weiterhin Schreibzugriff auf das Repository.

## Security-Checkliste vor Go-live

- [ ] Keine `.env`, `.dev.vars` oder Secrets im Commit
- [ ] `/admin/` nicht in Navigation, Sitemap oder RSS
- [ ] `/admin/*` liefert `X-Robots-Tag: noindex, nofollow`
- [ ] Access-Policy enthält nur `<DEINE_ERLAUBTE_EMAIL>`
- [ ] OAuth Callback stimmt exakt mit GitHub und Worker überein
- [ ] Worker-Secrets gesetzt, nicht im Quellcode
- [ ] Vorschau-Deployments geschützt
- [ ] `npm run validate:content && npm run typecheck && npm run build && npm run test && npm run test:routes && npm run check:links && npm run check:secrets` bestanden

## Datenschutz

GitHub OAuth, Cloudflare Access und der OAuth Worker sind administrative Dienste. Vor dem produktiven Einsatz die Datenschutzerklärung und gegebenenfalls den Auftragsverarbeitungsvertrag anhand der tatsächlich aktivierten Cloudflare-/GitHub-Konfiguration rechtlich prüfen lassen. Die öffentliche Website erhält dadurch kein Analyse- oder Marketingtracking.
