import type { APIRoute } from 'astro';

const routes = [
	'',
	'training/',
	'training/fortschritt-dokumentieren/',
	'supplements/',
	'gym-zubehoer/',
	'mein-weg/',
	'ueber-kraftradar/',
	'testmethode/',
];

export const GET: APIRoute = ({ site }) => {
	const baseURL = site ?? new URL('https://kraftradar.de');
	const urls = routes
		.map((route) => `\t<url><loc>${new URL(route, baseURL).href}</loc></url>`)
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
