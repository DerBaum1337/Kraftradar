# IndexNow

Cloudflare Crawler Hints ist für KraftRadar die normale Lösung: Es erkennt Änderungen an gecachten Seiten und kann dafür automatisch IndexNow-Hinweise senden. Deshalb ist dieses Skript **nicht** Teil von `npm run build` und wird nicht bei jedem Deployment ausgeführt.

Das Skript ist nur eine manuelle Absicherung nach einem erfolgreich abgeschlossenen Produktions-Deployment. Es verwendet ausschließlich die Produktionsdomain `https://kraftradar.de`, prüft jede Seite auf Erreichbarkeit und `noindex` und sendet höchstens eine gebündelte Anfrage.

## Manuelle Verwendung

Eine einzelne, bereits live erreichbare Seite melden:

```bash
npm run indexnow -- https://kraftradar.de/training/
```

Alle zulässigen URLs aus der Live-Sitemap melden:

```bash
npm run indexnow -- --sitemap
```

Ohne Argumente wird keine Anfrage gesendet. Vorschau-, `www`-, `localhost`-, Admin-, Draft- und `noindex`-Seiten werden nicht übermittelt.

Die öffentliche IndexNow-Schlüsseldatei liegt unter:

`https://kraftradar.de/4532f0b5102d5ee982d7a23938e680f7279272fc5f51bc1aff57d00e089185b1.txt`

IndexNow bestätigt die Annahme einer Anfrage mit HTTP `200` oder `202`. Die Annahme ist kein Versprechen, dass eine Suchmaschine die URL sofort indexiert.

Quellen: [Cloudflare Crawler Hints](https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/) und [IndexNow-Dokumentation](https://www.indexnow.org/documentation).
