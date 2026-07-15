import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArticle } from './content-validation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articleRoot = path.join(root, 'src', 'content', 'articles');

async function filesIn(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map(async (entry) => {
		const target = path.join(directory, entry.name);
		return entry.isDirectory() ? filesIn(target) : entry.name.endsWith('.md') ? [target] : [];
	}));
	return nested.flat();
}

const files = await filesIn(articleRoot);
const knownSlugs = new Set();
const results = [];
for (const file of files) {
	const source = await readFile(file, 'utf8');
	const result = validateArticle({ file: path.relative(root, file), source, knownSlugs, root });
	if (result.slug) knownSlugs.add(result.slug);
	results.push(result);
}

for (const result of results) {
	for (const warning of result.warnings) console.warn(`WARN ${result.file}: ${warning}`);
	for (const error of result.errors) console.error(`FEHLER ${result.file}: ${error}`);
}

if (results.some((result) => result.errors.length > 0)) process.exitCode = 1;
else console.log(`Content-Prüfung erfolgreich: ${results.length} Artikel.`);
