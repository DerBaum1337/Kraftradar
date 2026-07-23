/*
 * Sveltia hooks normalize article metadata directly before saving.
 * They do not mount or start the CMS a second time.
 */

const SVELTIA_ARTICLE_COLLECTIONS = new Set([
	'training',
	'supplements',
	'gym_zubehoer',
	'mein_weg',
]);

const PRODUCT_COLLECTIONS = new Set(['supplements', 'gym_zubehoer']);
const VALID_STATUSES = new Set(['draft', 'review', 'ready', 'published']);
const VALID_AFFILIATE_PARTNERS = new Set(['amazon', 'hsn']);

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

function normalizeAffiliate(data, collection) {
	if (!PRODUCT_COLLECTIONS.has(collection)) return data;

	const affiliate = data.get('affiliate');
	const hasAffiliate = Boolean(affiliate);

	if (!hasAffiliate) {
		data = data.setIn(['transparency', 'affiliateLinks'], false);
		if (data.get('product')) {
			data = data
				.setIn(['product', 'affiliateLinks'], false)
				.deleteIn(['product', 'affiliateUrl']);
		}
		return data;
	}

	const partner = String(affiliate.get('partner') || '').trim();
	const url = String(affiliate.get('url') || '').trim();
	const linkText = String(affiliate.get('linkText') || '').trim();

	if (!VALID_AFFILIATE_PARTNERS.has(partner)) {
		throw new Error('Bitte Amazon oder HSN als Affiliate-Partner auswählen.');
	}
	if (!url || !linkText) {
		throw new Error('Für die Affiliate-Box werden Link und Linktext benötigt.');
	}
	if (partner === 'amazon' && !/^https:\/\/(?:amzn\.to\/|(?:www\.)?amazon\.[^/]+\/)/i.test(url)) {
		throw new Error('Der ausgewählte Amazon-Partner benötigt einen Amazon- oder amzn.to-Link.');
	}
	if (partner === 'hsn' && !/^https:\/\/(?:www\.)?hsnstore\.de\//i.test(url)) {
		throw new Error('Der ausgewählte HSN-Partner benötigt einen Link zu hsnstore.de.');
	}

	data = data
		.setIn(['affiliate', 'partner'], partner)
		.setIn(['affiliate', 'url'], url)
		.setIn(['affiliate', 'linkText'], linkText)
		.setIn(['transparency', 'affiliateLinks'], true);

	if (data.get('product')) {
		data = data
			.setIn(['product', 'affiliateLinks'], true)
			.setIn(['product', 'affiliateUrl'], url);
	}

	return data;
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

	data = normalizeAffiliate(data, collection);

	return entry.set('data', data);
}

if (!window.CMS) {
	throw new Error('Sveltia CMS was not loaded before the admin hooks.');
}

window.CMS.registerEventListener({ name: 'preSave', handler: normalizeArticle });
