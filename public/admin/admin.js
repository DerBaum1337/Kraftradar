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

function toSlug(value) {
	return String(value || '')
		.toLocaleLowerCase('de-DE')
		.replace(/ß/g, 'ss')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function registerEditorialDefaults() {
	const categoryLabels = {
		training: 'Training',
		supplements: 'Supplements',
		'gym-zubehoer': 'Gym-Zubehör',
		'mein-weg': 'Mein Weg',
	};

	window.CMS.registerEventListener({
		name: 'preSave',
		handler: ({ entry }) => {
			if (entry.get('collection') !== 'articles') return entry.get('data');

			let data = entry.get('data');
			const title = String(data.get('title') || '').trim();
			const category = String(data.get('category') || 'training');
			const status = String(data.get('status') || 'draft');
			const description = String(data.get('description') || '').trim();

			if (!String(data.get('slug') || '').trim() && title) data = data.set('slug', toSlug(title));
			data = data.set('categoryLabel', categoryLabels[category] || 'Training');

			const seo = data.get('seo');
			if (seo?.get) {
				let nextSeo = seo;
				if (!String(seo.get('title') || '').trim()) nextSeo = nextSeo.set('title', title);
				if (!String(seo.get('description') || '').trim()) nextSeo = nextSeo.set('description', description);
				data = data.set('seo', nextSeo);
			}

			if (status === 'published') {
				const now = new Date().toISOString();
				if (!data.get('publishedAt')) data = data.set('publishedAt', now);
				data = data.set('updatedAt', now);
			}

			return data;
		},
	});
}

function startCms(attempt = 0) {
	if (!window.CMS || !window.createClass || !window.h) {
		if (attempt < 40) window.setTimeout(() => startCms(attempt + 1), 50);
		return;
	}

	window.CMS.registerPreviewStyle('/admin/preview.css');
	registerArticlePreview();
	registerEditorialDefaults();
	window.CMS.init();
}

/* Decaps deutsche Standardübersetzung ist hier unnötig umständlich.
 * React verwaltet den sichtbaren Text selbst; deshalb nie textContent ersetzen. */
function applyKraftRadarLabels() {
	for (const element of document.querySelectorAll('a, button, [role="button"]')) {
		if (element.textContent?.trim() === 'Neue(r/s) Artikel') {
			element.dataset.krNewArticle = 'true';
			element.setAttribute('aria-label', 'Neuer Artikel');
		}
	}

	const statusSelect = [...document.querySelectorAll('select')].find((select) => {
		const values = [...select.options].map((option) => option.value);
		return ['draft', 'review', 'ready', 'published'].every((status) => values.includes(status));
	});
	const labels = {
		draft: 'Entwurf speichern',
		review: 'Zur Überprüfung speichern',
		ready: 'Zur Veröffentlichung speichern',
		published: 'Veröffentlichen',
	};
	const label = labels[statusSelect?.value] || 'Entwurf speichern';

	for (const element of document.querySelectorAll('button, [role="button"]')) {
		if (element.textContent?.trim() === 'Veröffentlichen' || element.dataset.krPublishAction) {
			element.dataset.krPublishAction = 'true';
			element.dataset.krPublishLabel = label;
			element.setAttribute('aria-label', label);
		}
	}
}

/* Einige mobile Browser melden bei aktivierter Desktopansicht eine große
 * Viewportbreite. screen.width bleibt dagegen die echte Gerätebreite. */
if (Math.min(window.screen.width, window.screen.height) <= 820) {
	document.documentElement.classList.add('kr-mobile-device');
}

startCms();
applyKraftRadarLabels();
new MutationObserver(applyKraftRadarLabels).observe(document.body, { childList: true, subtree: true });
document.addEventListener('change', applyKraftRadarLabels);
