/*
 * Decap wird in index.astro bewusst erst nach der Preview-Registrierung
 * initialisiert. Sonst kann Decap bereits die eingebaute Rohdaten-Vorschau
 * rendern, bevor die KraftRadar-Vorlage verfügbar ist.
 */

function previewValue(entry, field, fallback = '') {
	return entry.getIn(['data', field], fallback);
}

function registerArticlePreview() {
	if (!window.CMS || !window.createClass || !window.h) return false;

	const h = window.h;
	const ArticlePreview = window.createClass({
		render() {
			const entry = this.props.entry;
			const title = previewValue(entry, 'title', 'Unbenannter Artikel');
			const category = previewValue(entry, 'categoryLabel', 'Training');
			const description = previewValue(entry, 'description', 'Hier erscheint die Kurzbeschreibung des Artikels.');
			const author = previewValue(entry, 'author', 'basti');
			const publishedAt = previewValue(entry, 'publishedAt', 'Entwurf');
			const content = this.props.widgetFor('body');

			return h('article', { className: 'kr-preview' }, [
				h('p', { className: 'kr-preview__eyebrow' }, category),
				h('h1', {}, title),
				h('p', { className: 'kr-preview__description' }, description),
				h('p', { className: 'kr-preview__meta' }, `${publishedAt} · Von ${author === 'basti' ? 'Basti' : author}`),
				h('hr'),
				h('div', { className: 'kr-preview__body' }, content || h('p', { className: 'kr-preview__empty' }, 'Der Artikelinhalt erscheint hier beim Schreiben.')),
			]);
		},
	});

	window.CMS.registerPreviewTemplate('articles', ArticlePreview);
	return true;
}

function startCms(attempt = 0) {
	if (!window.CMS || !window.createClass || !window.h) {
		if (attempt < 40) window.setTimeout(() => startCms(attempt + 1), 50);
		return;
	}

	window.CMS.registerPreviewStyle('/admin/preview.css');
	registerArticlePreview();
	window.CMS.init();
}

/* Decaps deutsche Standardübersetzung ist hier unnötig umständlich. */
function applyKraftRadarLabels() {
	for (const element of document.querySelectorAll('a, button, [role="button"]')) {
		if (element.textContent?.trim() === 'Neue(r/s) Artikel') {
			element.textContent = 'Neuer Artikel';
			element.setAttribute('aria-label', 'Neuer Artikel');
		}
	}
}

startCms();
applyKraftRadarLabels();
new MutationObserver(applyKraftRadarLabels).observe(document.body, { childList: true, subtree: true });
