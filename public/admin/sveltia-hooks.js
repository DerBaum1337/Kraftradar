/*
 * Sveltia-Hooks ergänzen ausschließlich Artikeldaten direkt vor dem
 * Speichern. Sie starten oder mounten das CMS nicht erneut.
 */

const SVELTIA_ARTICLE_COLLECTIONS = new Set([
	'training',
	'supplements',
	'gym_zubehoer',
	'mein_weg',
]);

const VALID_STATUSES = new Set(['draft', 'review', 'ready', 'published']);

const COLLECTION_CATEGORIES = {
	training: { category: 'training', categoryLabel: 'Training' },
	supplements: { category: 'supplements', categoryLabel: 'Supplements' },
	gym_zubehoer: { category: 'gym-zubehoer', categoryLabel: 'Gym-Zubehör' },
	mein_weg: { category: 'mein-weg', categoryLabel: 'Mein Weg' },
};

function slugFromPath(path) {
	const filename = String(path || '').replace(/\\/g, '/').split('/').pop() || '';
	return filename.replace(/\.[^.]+$/, '');
}

function removeEmpty(data, path) {
	return String(data.getIn(path) || '').trim() ? data : data.deleteIn(path);
}

function normalizeArticle({ entry }) {
	const collection = String(entry.get('collection') || '');
	if (!SVELTIA_ARTICLE_COLLECTIONS.has(collection)) return entry;

	let data = entry.get('data');
	const title = String(data.get('title') || '').trim();
	const description = String(data.get('description') || '').trim();
	const entrySlug = slugFromPath(entry.get('path')) || String(entry.get('slug') || '').trim();
	const selectedStatus = String(data.get('status') || 'draft');
	const status = VALID_STATUSES.has(selectedStatus) ? selectedStatus : 'draft';

	const category = COLLECTION_CATEGORIES[collection];
	data = data
		.set('slug', entrySlug)
		.set('status', status)
		.set('category', category.category)
		.set('categoryLabel', category.categoryLabel);
	data = data.setIn(['seo', 'title'], String(data.getIn(['seo', 'title']) || '').trim() || title);
	data = data.setIn(['seo', 'description'], String(data.getIn(['seo', 'description']) || '').trim() || description);
	data = removeEmpty(data, ['seo', 'canonical']);
	data = removeEmpty(data, ['seo', 'ogImage']);

	if (status === 'published') {
		const now = new Date().toISOString();
		if (!data.get('publishedAt')) data = data.set('publishedAt', now);
		data = data.set('updatedAt', now);
	} else {
		data = data.delete('publishedAt').delete('updatedAt');
	}

	const heroImagePath = String(data.getIn(['heroImage', 'src']) || '').trim();
	if (!heroImagePath) {
		data = data.delete('heroImage');
	} else {
		for (const field of ['caption', 'credit', 'creditUrl']) data = removeEmpty(data, ['heroImage', field]);
		if (data.getIn(['heroImage', 'alt']) == null) data = data.setIn(['heroImage', 'alt'], '');
	}

	return entry.set('data', data);
}

if (!window.CMS) {
	throw new Error('Sveltia CMS wurde vor den Admin-Hooks nicht geladen.');
}

window.CMS.registerEventListener({ name: 'preSave', handler: normalizeArticle });
