import type { APIRoute } from 'astro';
import { getPublishedArticles } from '../lib/artikel';

const routes = [
	'',
	'training/',
	'supplements/',
	'gym-zubehoer/',
	'mein-weg/',
	'ueber-kraftradar/',
	'testmethode/',
];

export const GET: APIRoute = async ({ site }) => {
	const baseURL = site ?? new URL('https://kraftradar.de');
	const articles = await getPublishedArticles();
	const articleRoutes = articles.map((article) => ({
		route: `${article.data.category}/${article.id}/`,
		lastModified: article.data.updatedAt ?? article.data.publishedAt,
	}));
	const urls = [
		...routes.map((route) => ({ route })),
		...articleRoutes,
	]
		.map(({ route, lastModified }) => {
			const lastmod = lastModified
				? `<lastmod>${lastModified.toISOString().slice(0, 10)}</lastmod>`
				: '';
			return `\t<url><loc>${new URL(route, baseURL).href}</loc>${lastmod}</url>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
