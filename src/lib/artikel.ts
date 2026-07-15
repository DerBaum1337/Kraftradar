import { getCollection, type CollectionEntry } from 'astro:content';

export type ArtikelKategorie = CollectionEntry<'artikel'>['data']['category'];
export type Artikel = CollectionEntry<'artikel'>;

export async function getPublishedArticles(): Promise<Artikel[]> {
	const includeDrafts = import.meta.env.DEV;

	return (await getCollection('artikel', ({ data }) => !data.draft || includeDrafts)).sort(
		(a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
	);
}

export async function getArticlesByCategory(category: ArtikelKategorie): Promise<Artikel[]> {
	return (await getPublishedArticles()).filter((article) => article.data.category === category);
}

export async function getLatestArticles(limit = 3): Promise<Artikel[]> {
	return (await getPublishedArticles()).slice(0, limit);
}
