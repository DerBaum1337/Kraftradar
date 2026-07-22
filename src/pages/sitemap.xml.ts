import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getIndexableArticles } from '../lib/artikel';

const fixedRoutes = [
	'',
	'training/',
	'mein-weg/',
	'ueber-kraftradar/',
	'testmethode/',
	'tools/',
	'tools/proteinbedarf-rechner/',
	'tools/whey-preisvergleich/',
	'tools/egym-fortschrittsrechner/',
	'tools/aufbau-shake-rechner/',
	'tools/koerperfortschritt-auswerten/',
];

export const GET: APIRoute = async ({ site }) => {
	const baseURL = site ?? new URL('https://kraftradar.de');
	const articles = await getIndexableArticles();
	const authors = await getCollection('authors');
	const categoryRoutes = [
		articles.some((article) => article.data.category === 'supplements') ? 'supplements/' : null,
		articles.some((article) => article.data.category === 'gym-zubehoer') ? 'gym-zubehoer/' : null,
	].filter((route): route is string => Boolean(route));
	const articleRoutes = articles.map((article) => ({
		route: `${article.data.category}/${article.data.slug}/`,
		lastModified: article.data.updatedAt ?? article.data.publishedAt,
	}));
	const authorRoutes = authors.map((author) => ({ route: `autoren/${author.data.slug}/` }));
	const routes: Array<{ route: string; lastModified?: Date }> = [
		...fixedRoutes.map((route) => ({ route })),
		...categoryRoutes.map((route) => ({ route })),
		...authorRoutes,
		...articleRoutes,
	];
	const urls = routes
		.map(({ route, lastModified }) => {
			const lastmod = lastModified ? `<lastmod>${lastModified.toISOString().slice(0, 10)}</lastmod>` : '';
			return `\t<url><loc>${new URL(route, baseURL).href}</loc>${lastmod}</url>`;
		})
		.join('\n');

	return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
};
