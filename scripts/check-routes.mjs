import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = JSON.parse(await readFile(path.join(root, 'backups', 'public-urls-before-cms.json'), 'utf8'));
const failures = [];

for (const route of snapshot.publicUrls) {
	const file = route === '/' ? 'dist/index.html' : `dist${route}index.html`;
	try {
		await stat(path.join(root, file));
		const html = await readFile(path.join(root, file), 'utf8');
		if ((html.match(/<h1(?:\s|>)/g) ?? []).length !== 1) failures.push(`${route}: erwartet genau eine H1.`);
		if (!html.includes('<link rel="canonical"')) failures.push(`${route}: Canonical fehlt.`);
	} catch {
		failures.push(`${route}: Build-Datei fehlt.`);
	}
}

try {
	const admin = await readFile(path.join(root, 'dist', 'admin', 'index.html'), 'utf8');
	if (!admin.includes('noindex,nofollow,noarchive')) failures.push('/admin/: noindex-Metatag fehlt.');
	if (!admin.includes('decap-cms@3.11.0')) failures.push('/admin/: feste Decap-CMS-Version fehlt.');
} catch {
	failures.push('/admin/: Build-Datei fehlt.');
}

if (failures.length) {
	failures.forEach((failure) => console.error(`FEHLER ${failure}`));
	process.exitCode = 1;
} else console.log(`Routenprüfung erfolgreich: ${snapshot.publicUrls.length} bestehende URLs.`);
