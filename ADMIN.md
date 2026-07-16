# Adminbereich

## Vor dem ersten Einsatz

Der produktive Login funktioniert erst nach den manuellen GitHub-, Cloudflare-Worker- und Access-Schritten aus [DEPLOYMENT.md](DEPLOYMENT.md). Ohne diese Konfiguration ist `/admin/` bewusst nicht schreibfähig.

## Artikel erstellen

1. `/admin/` öffnen und anmelden.
2. Den passenden Bereich wählen: **Training**, **Supplements**, **Gym-Zubehör** oder **Mein Weg**.
3. **Neuer Trainingsartikel**, **Neuer Supplement-Artikel**, **Neuer Zubehörartikel** oder **Neuer Mein-Weg-Beitrag** wählen.
4. Titel, Artikeltyp, Status, Kurzbeschreibung und Text auf Übersichtsseiten ausfüllen. Kategorie und Autor werden automatisch gesetzt.
5. Den Artikelinhalt ohne zusätzliche H1 schreiben. Zwischenüberschriften beginnen mit H2.
6. Bei `Veröffentlicht` ein Veröffentlichungsdatum setzen. Das Aktualisierungsdatum wird beim späteren Veröffentlichen automatisch gepflegt.
7. Artikelbild, Quellen, verwandte Artikel und SEO-Einstellungen bei Bedarf in den eingeklappten Bereichen ergänzen.
8. Zunächst als **Entwurf** oder **In Überprüfung** speichern.
9. Die Vorschau-Deployment-URL prüfen. Unveröffentlichte persönliche Inhalte dürfen erst nach dem Access-Schutz für Vorschauen geprüft werden.
10. Erst nach Prüfung Status auf **Veröffentlicht** setzen und den Git-Änderungsvorschlag zusammenführen.

Bei **Supplements** und **Gym-Zubehör** erscheinen zusätzlich die Bereiche für Transparenz, Produktdaten, Vor- und Nachteile, Zielgruppen und Preis-Leistung. Bei **Mein Weg** stehen stattdessen Zwischenfazit und Langzeitupdate bereit.

## Bestehenden Artikel bearbeiten

Bestehende Slugs veröffentlichter Artikel nicht ändern. Falls es unvermeidbar ist, zuerst eine permanente Weiterleitung für die alte URL in der Deployment-Konfiguration ergänzen und danach URL- und Canonical-Tests ausführen.

## Bilder

- Erlaubt: JPEG, PNG, WebP und AVIF.
- Nicht hochladen: SVG, ausführbare Dateien oder Bilder mit privaten Kennungen.
- Ziel: `public/uploads/articles/`.
- Empfohlen: maximal 2400 Pixel Kantenlänge und möglichst unter 500 KB pro Bild.
- Dateinamen klein, mit Bindestrichen und ohne Umlaute.

## Rückgängig machen

Jede CMS-Speicherung erzeugt einen Git-Commit oder Pull Request. Einen älteren Zustand stellt man über GitHub **History** wieder her oder erstellt einen Revert-Commit. Keine Datei wird außerhalb der Git-Historie endgültig gelöscht.

## Fehler

Bei einer Content-Fehlermeldung zuerst lokal ausführen:

```bash
npm run validate:content
npm run typecheck
npm run build
```

Die Meldung nennt die betroffene Datei oder das fehlende Feld. Entwürfe werden absichtlich nicht auf Kategorie-, Sitemap- oder RSS-Seiten angezeigt.
