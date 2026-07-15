import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oldDirectory = path.join(root, 'src', 'content', 'artikel');
const newDirectory = path.join(root, 'src', 'content', 'articles');

const articles = [
	{
		file: 'fortschritt-dokumentieren.md',
		slug: 'fortschritt-dokumentieren',
		category: 'training',
		categoryLabel: 'Training · Grundlagen',
		articleType: 'guide',
		publishedAt: '2026-07-14T09:00:00+02:00',
		description: 'Eine einfache und nachvollziehbare Methode, um Gewichte, Wiederholungen, Geräteeinstellungen und Trainingseindrücke festzuhalten.',
		relatedArticles: ['egym-gewichte-verstehen', 'acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte'],
	},
	{
		file: 'egym-fuer-anfaenger-so-laeuft-mein-training-ab.md',
		slug: 'egym-fuer-anfaenger-so-laeuft-mein-training-ab',
		category: 'training',
		categoryLabel: 'Training',
		articleType: 'experience',
		publishedAt: '2026-07-15T10:00:00+02:00',
		description: 'Mein Einstieg mit EGYM: Einweisung, Armband, automatische Geräteeinstellungen und was das System als Anfänger für mich übernimmt.',
		relatedArticles: ['egym-gewichte-verstehen', 'vom-unsportlichen-raucher-zum-regelmaessigen-training'],
	},
	{
		file: 'egym-gewichte-verstehen.md',
		slug: 'egym-gewichte-verstehen',
		category: 'training',
		categoryLabel: 'Training',
		articleType: 'guide',
		publishedAt: '2026-07-15T12:00:00+02:00',
		description: 'Warum 90 kg exzentrisch, 100 kg adaptiv und 163 kg isokinetisch an derselben EGYM-Beinpresse nicht dieselbe Belastung bedeuten.',
		relatedArticles: ['egym-fuer-anfaenger-so-laeuft-mein-training-ab', 'fortschritt-dokumentieren'],
	},
	{
		file: 'vom-unsportlichen-raucher-zum-regelmaessigen-training.md',
		slug: 'vom-unsportlichen-raucher-zum-regelmaessigen-training',
		category: 'mein-weg',
		categoryLabel: 'Mein Weg',
		articleType: 'experience',
		publishedAt: '2026-07-14T12:00:00+02:00',
		description: 'Nach 13 Jahren Rauchen und drei Jahren Vapen habe ich bei null mit Sport angefangen. Hier erzähle ich, warum ich mich für EGYM entschieden habe und was sich seitdem verändert hat.',
		relatedArticles: ['egym-fuer-anfaenger-so-laeuft-mein-training-ab', 'acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte'],
	},
	{
		file: 'acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte.md',
		slug: 'acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte',
		category: 'mein-weg',
		categoryLabel: 'Mein Weg',
		articleType: 'progress',
		publishedAt: '2026-07-15T09:00:00+02:00',
		description: 'Nach den ersten Wochen mit EGYM dokumentiere ich Körpermaße, Gewicht, Körperanalyse und Trainingsfortschritte – mit einer ehrlichen Einordnung der Grenzen dieser Daten.',
		relatedArticles: ['vom-unsportlichen-raucher-zum-regelmaessigen-training', 'egym-gewichte-verstehen'],
	},
];

function bodyWithoutFrontmatter(source) {
	return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

function quote(value) {
	return JSON.stringify(value);
}

async function main() {
	if (!existsSync(oldDirectory)) {
		throw new Error(`Quellordner fehlt: ${oldDirectory}`);
	}

	for (const article of articles) {
		const sourcePath = path.join(oldDirectory, article.file);
		const source = await readFile(sourcePath, 'utf8');
		const targetDirectory = path.join(newDirectory, article.category);
		const targetPath = path.join(targetDirectory, article.file);
		await mkdir(targetDirectory, { recursive: true });

		const frontmatter = [
			'---',
			`title: ${quote(article.slug === 'fortschritt-dokumentieren' ? 'Trainingsfortschritt sinnvoll dokumentieren' : source.match(/^title:\s*["']?([^\n"']+)/m)?.[1] ?? article.slug)}`,
			`slug: ${article.slug}`,
			`category: ${article.category}`,
			`categoryLabel: ${quote(article.categoryLabel)}`,
			`articleType: ${article.articleType}`,
			'status: published',
			`description: ${quote(article.description)}`,
			`excerpt: ${quote(article.description)}`,
			`publishedAt: ${article.publishedAt}`,
			'author: basti',
			'featured: false',
			'noindex: false',
			'toc: true',
			'seo:',
			`  title: ${quote(article.slug === 'fortschritt-dokumentieren' ? 'Trainingsfortschritt sinnvoll dokumentieren' : source.match(/^title:\s*["']?([^\n"']+)/m)?.[1] ?? article.slug)}`,
			`  description: ${quote(article.description)}`,
			'  canonical: ""',
			'  ogImage: ""',
			'relatedArticles:',
			...article.relatedArticles.map((related) => `  - ${related}`),
			'sources: []',
			'transparency:',
			'  personalExperience: true',
			'  selfPurchased: null',
			'  sponsored: false',
			'  affiliateLinks: false',
			'  note: ""',
			'pros: []',
			'cons: []',
			'bestFor: []',
			'lessSuitableFor: []',
			'shortConclusion: ""',
			'valueAssessment: ""',
			'interimConclusion: ""',
			'longTermUpdate: ""',
			'---',
			'',
		].join('\n');

		await writeFile(targetPath, frontmatter + bodyWithoutFrontmatter(source), 'utf8');
	}

	const legacyBackup = path.join(root, 'backups', 'legacy-content-artikel');
	if (!existsSync(legacyBackup)) {
		await cp(oldDirectory, legacyBackup, { recursive: true });
	}
	await rm(oldDirectory, { recursive: true, force: true });
	console.log(`Migriert: ${articles.length} Artikel nach ${path.relative(root, newDirectory)}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
