/*
 * Decap is initialized manually after its script has loaded. The documented
 * initCMS() entry point avoids a second initialization in the same DOM tree.
 * The built-in split preview remains disabled for now: it was the unstable
 * part on smaller viewports and could trigger React's removeChild error.
 */

let cmsStarted = false;

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
	if (cmsStarted) return;

	if (!window.CMS || typeof window.initCMS !== 'function') {
		if (attempt < 40) window.setTimeout(() => startCms(attempt + 1), 50);
		return;
	}

	cmsStarted = true;
	registerEditorialDefaults();
	/* The preview is currently disabled in config.yml. Registering its style here
	 * keeps a future reactivation inside the same single initialization path. */
	window.CMS.registerPreviewStyle('/admin/preview.css?v=20260716-4');
	window.initCMS();
}

/* Some mobile browsers report a desktop viewport in desktop-site mode.
 * screen.width remains the actual physical device width. */
if (Math.min(window.screen.width, window.screen.height) <= 820) {
	document.documentElement.classList.add('kr-mobile-device');
}

startCms();
