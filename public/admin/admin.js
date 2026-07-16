/*
 * Decap starts itself from the CDN script in index.html. This file deliberately
 * does not call initCMS(): a manual second mount caused React's removeChild
 * error in the live administration area. It only registers safe editorial
 * defaults after the public CMS API becomes available.
 */

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
	const collectionCategories = {
		training: 'training',
		supplements: 'supplements',
		gym_zubehoer: 'gym-zubehoer',
		mein_weg: 'mein-weg',
	};

	window.CMS.registerEventListener({
		name: 'preSave',
		handler: ({ entry }) => {
			const collection = String(entry.get('collection') || '');
			const fixedCategory = collectionCategories[collection];
			if (!fixedCategory) return entry.get('data');

			let data = entry.get('data');
			const title = String(data.get('title') || '').trim();
			const category = fixedCategory;
			const status = String(data.get('status') || 'draft');
			const description = String(data.get('description') || '').trim();

			if (!String(data.get('slug') || '').trim() && title) data = data.set('slug', toSlug(title));
			data = data.set('category', category).set('categoryLabel', categoryLabels[category] || 'Training');

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

function registerWhenReady(attempt = 0) {
	if (!window.CMS) {
		if (attempt < 40) window.setTimeout(() => registerWhenReady(attempt + 1), 50);
		return;
	}

	registerEditorialDefaults();
}

/* Some mobile browsers report a desktop viewport in desktop-site mode.
 * screen.width remains the actual physical device width. */
if (Math.min(window.screen.width, window.screen.height) <= 820) {
	document.documentElement.classList.add('kr-mobile-device');
}

registerWhenReady();
