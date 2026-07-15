import path from 'node:path';
import { existsSync } from 'node:fs';

export const VALID_CATEGORIES = new Set(['training', 'supplements', 'gym-zubehoer', 'mein-weg']);
export const VALID_STATUSES = new Set(['draft', 'review', 'ready', 'published']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function splitFrontmatter(source) {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { frontmatter: '', body: source };
	return { frontmatter: match[1], body: match[2] };
}

export function frontmatterValue(frontmatter, key) {
	const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
	return match?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

export function validateArticle({ file, source, knownSlugs = new Set(), root = process.cwd() }) {
	const errors = [];
	const warnings = [];
	const { frontmatter, body } = splitFrontmatter(source);
	const publishedAt = frontmatterValue(frontmatter, 'publishedAt');
	const updatedAt = frontmatterValue(frontmatter, 'updatedAt');
	for (const [field, value] of [['publishedAt', publishedAt], ['updatedAt', updatedAt]]) {
		if (value && Number.isNaN(new Date(value).getTime())) errors.push(`Ungültiges Datum in ${field}.`);
	}
	if (!frontmatter) errors.push('Frontmatter fehlt.');
	const required = ['title', 'slug', 'category', 'articleType', 'status', 'description', 'excerpt', 'author'];
	for (const key of required) if (!frontmatterValue(frontmatter, key)) errors.push(`Pflichtfeld fehlt: ${key}.`);
	const slug = frontmatterValue(frontmatter, 'slug');
	if (slug && !SLUG_PATTERN.test(slug)) errors.push('Slug muss klein geschrieben sein und darf nur Bindestriche enthalten.');
	if (slug && knownSlugs.has(slug)) errors.push(`Doppelter Slug: ${slug}.`);
	if (!VALID_CATEGORIES.has(frontmatterValue(frontmatter, 'category'))) errors.push('Ungültige Kategorie.');
	if (!VALID_STATUSES.has(frontmatterValue(frontmatter, 'status'))) errors.push('Ungültiger Veröffentlichungsstatus.');
	if (frontmatterValue(frontmatter, 'status') === 'published' && !frontmatterValue(frontmatter, 'publishedAt')) errors.push('Veröffentlichte Artikel benötigen publishedAt.');
	if (/^#\s+/m.test(body)) errors.push('Der Artikelinhalt darf keine zusätzliche H1 enthalten.');
	if (/^#{4,}\s+/m.test(body) && !/^###\s+/m.test(body)) warnings.push('Möglicherweise übersprungene Überschriftenebene.');
	if (/^#{2,}\s*$/m.test(body)) errors.push('Leere Überschrift gefunden.');
	if (/<script\b|\son\w+\s*=|javascript:/i.test(body)) errors.push('Unsicheres HTML oder JavaScript im Artikelinhalt gefunden.');
	for (const match of body.matchAll(/\]\((\/[^)\s]+)\)/g)) {
		const target = match[1].split('#')[0];
		if (target && !target.endsWith('/') && !target.includes('.')) warnings.push(`Interner Link ohne abschließenden Slash prüfen: ${target}`);
	}
	for (const match of frontmatter.matchAll(/^\s*src:\s*["']?([^\s"']+)/gm)) {
		const image = match[1];
		if (image.startsWith('/') && !existsSync(path.join(root, 'public', image))) errors.push(`Artikelbild fehlt: ${image}`);
		if (/\.svg$/i.test(image)) errors.push('SVG-Upload ist für Artikelbilder nicht zugelassen.');
	}
	return { file, slug, errors, warnings };
}
