# Sicherung vor der CMS-Migration

Die Datei `public-urls-before-cms.json` ist die Route- und Medienbestandsaufnahme vor der Inhaltsmigration.

## Rückfallstrategie

1. Die Ausgangsversion liegt unverändert in Git beim Commit `870ca6d`.
2. Vor einem Deployment wird `npm run test:routes` gegen den Produktionsbuild ausgeführt. Jede hier dokumentierte URL muss weiterhin eine Seite erzeugen.
3. Bei einem Fehler kann ein einzelner Inhalt aus der Git-Historie wiederhergestellt werden; bei einem schwerwiegenden Problem kann Cloudflare Pages auf den letzten erfolgreichen Deployment-Commit zurückgesetzt werden.
4. Alte Inhalte werden erst entfernt, nachdem die neue URL-Prüfung im lokalen Produktionsbuild erfolgreich war.

Diese Sicherung enthält keine Zugangsdaten oder personenbezogenen Verwaltungsdaten.
