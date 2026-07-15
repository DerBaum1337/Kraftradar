import type { APIRoute } from 'astro';
import { getIndexableArticles } from '../lib/artikel';
import { lesezeitInMinuten } from '../lib/lesezeit';

function escapeXml(value: string): string {
	return value.replace(/[<>&'\"]/g, (character) => ({
		'<': '&lt;',
		'>': '&gt;',
		'&': '&amp;',
		"'": '&apos;',
		'"': '&quot;',
	}[character] ?? character));
}

export const GET: APIRoute = async ({ site }) => {
	const baseURL = site ?? new URL('https://kraftradar.de');
	const articles = await getIndexableArticles();
	const items = articles.map((article) => {
		const url = new URL(`/${article.data.category}/${article.data.slug}/`, baseURL).href;
		const date = article.data.publishedAt?.toUTCString() ?? '';
		return `<item>
	<title>${escapeXml(article.data.title)}</title>
	<link>${url}</link>
	<guid isPermaLink="true">${url}</guid>
	<description>${escapeXml(article.data.excerpt)}</description>
	<pubDate>${date}</pubDate>
	<category>${escapeXml(article.data.categoryLabel)}</category>
	<author>${escapeXml(article.data.author)}</author>
	<content:encoded><![CDATA[${escapeXml(article.data.excerpt)} (${lesezeitInMinuten(article.body ?? '')} Min. Lesezeit)]]></content:encoded>
</item>`;
	}).join('\n');

	return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
<title>KraftRadar</title>
<link>${baseURL.href}</link>
<description>Persönliche EGYM-Erfahrungen, Training und Gym-Produkte ehrlich eingeordnet.</description>
<language>de-DE</language>
${items}
</channel>
</rss>`, {
		headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
	});
};
