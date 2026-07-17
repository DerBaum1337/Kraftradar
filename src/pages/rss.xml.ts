import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
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

function escapeCdata(value: string): string {
	return value.replaceAll(']]>', ']]]]><![CDATA[>');
}

export const GET: APIRoute = async ({ site }) => {
	const baseURL = site ?? new URL('https://kraftradar.de');
	const [articles, authors] = await Promise.all([
		getIndexableArticles(),
		getCollection('authors'),
	]);
	const authorNames = new Map(authors.map((author) => [author.data.slug, author.data.name]));
	const items = articles.map((article) => {
		const url = new URL(`/${article.data.category}/${article.data.slug}/`, baseURL).href;
		const date = article.data.publishedAt?.toUTCString() ?? '';
		const authorName = authorNames.get(article.data.author) ?? article.data.author;
		const encodedContent = escapeCdata(
			`${article.data.excerpt} (${lesezeitInMinuten(article.body ?? '')} Min. Lesezeit)`,
		);
		return `<item>
	<title>${escapeXml(article.data.title)}</title>
	<link>${url}</link>
	<guid isPermaLink="true">${url}</guid>
	<description>${escapeXml(article.data.excerpt)}</description>
	<pubDate>${date}</pubDate>
	<category>${escapeXml(article.data.categoryLabel)}</category>
	<dc:creator>${escapeXml(authorName)}</dc:creator>
	<content:encoded><![CDATA[${encodedContent}]]></content:encoded>
</item>`;
	}).join('\n');

	return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
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
