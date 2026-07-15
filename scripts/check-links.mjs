import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const failures = [];

async function htmlFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map(async (entry) => {
		const target = path.join(directory, entry.name);
		return entry.isDirectory() ? htmlFiles(target) : entry.name.endsWith('.html') ? [target] : [];
	}));
	return nested.flat();
}

for (const file of await htmlFiles(dist)) {
	const html = await readFile(file, 'utf8');
	for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
		const url = match[1];
		if (url.startsWith('/_astro/') || url.startsWith('/admin/')) continue;
		const candidates = url.endsWith('/') ? [`${url}index.html`] : [url, `${url}/index.html`];
		const found = await Promise.any(candidates.map(async (candidate) => stat(path.join(dist, candidate)).then(() => true))).catch(() => false);
		if (!found) failures.push(`${path.relative(root, file)} → ${url}`);
	}
}

if (failures.length) {
	failures.forEach((failure) => console.error(`FEHLER Interner Link oder Asset fehlt: ${failure}`));
	process.exitCode = 1;
} else console.log('Interne Links und lokale Assets im Produktionsbuild sind gültig.');
