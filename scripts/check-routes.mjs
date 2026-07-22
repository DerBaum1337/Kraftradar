import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = JSON.parse(await readFile(path.join(root, 'backups', 'public-urls-before-cms.json'), 'utf8'));
const failures = [];
const toolRoutes = [
	'/tools/',
	'/tools/proteinbedarf-rechner/',
	'/tools/whey-preisvergleich/',
	'/tools/egym-fortschrittsrechner/',
	'/tools/aufbau-shake-rechner/',
	'/tools/koerperfortschritt-auswerten/',
];
const toolFormIds = new Map([
	['/tools/proteinbedarf-rechner/', 'proteinbedarf-form'],
	['/tools/whey-preisvergleich/', 'whey-preisvergleich-form'],
	['/tools/egym-fortschrittsrechner/', 'egym-fortschritt-form'],
	['/tools/aufbau-shake-rechner/', 'aufbau-shake-form'],
	['/tools/koerperfortschritt-auswerten/', 'koerperfortschritt-form'],
]);

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
	if (!/name="robots"\s+content="noindex,\s*nofollow"/i.test(admin)) failures.push('/admin/: noindex-Metatag fehlt.');
	if (!admin.includes('@sveltia/cms@0.171.0')) failures.push('/admin/: feste Sveltia-CMS-Version fehlt.');
	if (admin.includes('decap-cms')) failures.push('/admin/: veraltetes Decap-Skript wird noch geladen.');
} catch {
	failures.push('/admin/: Build-Datei fehlt.');
}

try {
	await stat(path.join(root, 'dist', 'admin-v2'));
	failures.push('/admin-v2/: veralteter Admin-Build ist noch vorhanden.');
} catch (error) {
	if (error?.code !== 'ENOENT') failures.push('/admin-v2/: Abwesenheit konnte nicht geprüft werden.');
}

for (const route of toolRoutes) {
	const file = `dist${route}index.html`;
	try {
		const html = await readFile(path.join(root, file), 'utf8');
		if ((html.match(/<h1(?:\s|>)/g) ?? []).length !== 1) failures.push(`${route}: erwartet genau eine H1.`);
		if (!html.includes(`<link rel="canonical" href="https://kraftradar.de${route}">`)) failures.push(`${route}: selbstreferenzierender Canonical fehlt.`);
		if (/name="robots"\s+content="[^"]*noindex/i.test(html)) failures.push(`${route}: darf nicht noindex sein.`);
		if (!html.includes('class="tool-privacy-notice"') || !html.includes('Die Berechnung erfolgt lokal in deinem Browser.')) failures.push(`${route}: Datenschutzhinweis fehlt.`);
		if (route !== '/tools/' && !html.includes('Für die interaktive Berechnung muss JavaScript in deinem Browser aktiviert sein.')) failures.push(`${route}: Noscript-Hinweis fehlt.`);
		const formId = toolFormIds.get(route);
		if (formId && !html.includes(`id="${formId}"`)) failures.push(`${route}: Rechnerwurzel ${formId} fehlt.`);
		if (route !== '/tools/' && !html.includes('href="/tools/"')) failures.push(`${route}: Rücklink zur Tools-Übersicht fehlt.`);
	} catch {
		failures.push(`${route}: Build-Datei fehlt.`);
	}
}

try {
	const toolsOverview = await readFile(path.join(root, 'dist', 'tools', 'index.html'), 'utf8');
	for (const route of toolRoutes.slice(1)) {
		if (!toolsOverview.includes(`href="${route}"`)) failures.push(`/tools/: Link zu ${route} fehlt.`);
	}
} catch {
	failures.push('/tools/: Übersicht konnte nicht gelesen werden.');
}

try {
	const sitemap = await readFile(path.join(root, 'dist', 'sitemap.xml'), 'utf8');
	for (const route of toolRoutes) {
		if (!sitemap.includes(`https://kraftradar.de${route}`)) failures.push(`sitemap.xml: ${route} fehlt.`);
	}
} catch {
	failures.push('sitemap.xml: konnte nicht gelesen werden.');
}

try {
	const rss = await readFile(path.join(root, 'dist', 'rss.xml'), 'utf8');
	if (rss.includes('/tools/')) failures.push('rss.xml: Toolroute darf nicht enthalten sein.');
} catch {
	failures.push('rss.xml: konnte nicht gelesen werden.');
}

try {
	const homepage = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
	if (!homepage.includes('href="/tools"') || !homepage.includes('Eigene Werte nachvollziehbar berechnen')) failures.push('Startseite: Toolkarte fehlt.');
	if (!homepage.includes('>Tools<')) failures.push('Header: Navigationspunkt Tools fehlt.');
} catch {
	failures.push('Startseite: konnte nicht gelesen werden.');
}

if (failures.length) {
	failures.forEach((failure) => console.error(`FEHLER ${failure}`));
	process.exitCode = 1;
} else console.log(`Routenprüfung erfolgreich: ${snapshot.publicUrls.length} bestehende URLs und ${toolRoutes.length} Toolrouten.`);
