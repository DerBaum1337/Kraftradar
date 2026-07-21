import { getCollection, type CollectionEntry } from 'astro:content';

export type ArtikelKategorie = CollectionEntry<'articles'>['data']['category'];
export type Artikel = CollectionEntry<'articles'>;

function isPublicArticle(article: Artikel, now = new Date()): boolean {
	const { data } = article;
	return data.status === 'published'
		&& Boolean(data.publishedAt)
		&& data.publishedAt!.getTime() <= now.getTime();
}

export async function getAllArticles(): Promise<Artikel[]> {
	return getCollection('articles');
}

export async function getPublishedArticles(): Promise<Artikel[]> {
	return (await getAllArticles())
		.filter((article) => isPublicArticle(article))
		.sort((a, b) => {
			const zeitunterschied = b.data.publishedAt!.getTime() - a.data.publishedAt!.getTime();
			return zeitunterschied || b.data.slug.localeCompare(a.data.slug, 'de');
		});
}

export async function getIndexableArticles(): Promise<Artikel[]> {
	return (await getPublishedArticles()).filter((article) => !article.data.noindex);
}

export async function getArticlesByCategory(category: ArtikelKategorie): Promise<Artikel[]> {
	return (await getPublishedArticles())
		.filter((article) => article.data.category === category)
		.sort((a, b) => Number(b.data.featured) - Number(a.data.featured)
			|| b.data.publishedAt!.getTime() - a.data.publishedAt!.getTime()
			|| b.data.slug.localeCompare(a.data.slug, 'de'));
}

export async function getLatestArticles(limit = 3): Promise<Artikel[]> {
	return (await getPublishedArticles()).slice(0, limit);
}

export async function getArticleBySlug(slug: string): Promise<Artikel | undefined> {
	return (await getAllArticles()).find((article) => article.data.slug === slug);
}

export async function getRelatedArticles(article: Artikel, limit = 2): Promise<Artikel[]> {
	const published = await getPublishedArticles();
	const available = published.filter((candidate) => candidate.data.slug !== article.data.slug && !candidate.data.noindex);
	const manual = article.data.relatedArticles
		.map((slug) => available.find((candidate) => candidate.data.slug === slug))
		.filter((candidate): candidate is Artikel => Boolean(candidate));
	const fallback = available.filter(
		(candidate) => candidate.data.category === article.data.category && !manual.some((item) => item.data.slug === candidate.data.slug),
	);

	return [...manual, ...fallback].slice(0, limit);
}
