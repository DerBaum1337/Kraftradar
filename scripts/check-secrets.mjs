import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', 'node_modules', 'dist', '.wrangler', 'backups']);
const allowedExamples = new Set(['.env.example']);
const suspiciousPatterns = [
	/ghp_[A-Za-z0-9]{20,}/,
	/github_pat_[A-Za-z0-9_]{20,}/,
	/-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/,
	/(?:client_secret|oauth_state_secret)\s*[:=]\s*["'](?!<)[^"']{12,}/i,
];

async function collect(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const results = await Promise.all(entries.map(async (entry) => {
		if (ignored.has(entry.name)) return [];
		const target = path.join(directory, entry.name);
		if (entry.isDirectory()) return collect(target);
		if (!/\.(?:astro|md|mjs|js|ts|json|ya?ml|toml|env)$/i.test(entry.name) && !allowedExamples.has(entry.name)) return [];
		return [target];
	}));
	return results.flat();
}

const findings = [];
for (const file of await collect(root)) {
	const content = await readFile(file, 'utf8');
	for (const pattern of suspiciousPatterns) {
		if (pattern.test(content)) findings.push(`${path.relative(root, file)} enthält ein mögliches Secret (${pattern}).`);
	}
}

if (findings.length) {
	findings.forEach((finding) => console.error(`FEHLER ${finding}`));
	process.exitCode = 1;
} else {
	console.log('Secret-Prüfung erfolgreich: Keine Zugangsdaten oder privaten Schlüssel im Quellcode gefunden.');
}
