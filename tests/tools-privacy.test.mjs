import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directories = [path.join(root, 'src', 'scripts', 'tools'), path.join(root, 'src', 'lib', 'tools')];
const forbiddenPatterns = [
	/\bfetch\s*\(/,
	/\bXMLHttpRequest\b/,
	/\bWebSocket\b/,
	/\bsendBeacon\b/,
	/\blocalStorage\b/,
	/\bsessionStorage\b/,
	/\bdocument\.cookie\b/,
	/\binnerHTML\b/,
	/\binsertAdjacentHTML\b/,
	/\beval\s*\(/,
	/\bnew Function\b/,
];

test('Produktive Toolskripte verwenden keine Übertragungs-, Speicher- oder unsicheren HTML-APIs', async () => {
	for (const directory of directories) {
		for (const file of await readdir(directory)) {
			if (!file.endsWith('.mjs')) continue;
			const source = await readFile(path.join(directory, file), 'utf8');
			for (const pattern of forbiddenPatterns) assert.equal(pattern.test(source), false, `${file}: ${pattern}`);
		}
	}
});
