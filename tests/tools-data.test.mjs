import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tools } from '../src/data/tools.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedIds = ['proteinbedarf', 'whey-preisvergleich', 'egym-fortschritt', 'aufbau-shake', 'koerperfortschritt'];

test('Der Toolkatalog enthält genau fünf eindeutige Tools', () => {
	assert.equal(tools.length, 5);
	assert.deepEqual(tools.map((tool) => tool.id), expectedIds);
	assert.equal(new Set(tools.map((tool) => tool.id)).size, tools.length);
	assert.equal(new Set(tools.map((tool) => tool.href)).size, tools.length);
	for (const tool of tools) {
		assert.ok(tool.href.startsWith('/tools/'));
		assert.ok(tool.href.endsWith('/'));
		assert.ok(tool.resultItems.length <= 3);
		assert.ok(!tool.relatedTools.includes(tool.id));
		for (const relatedTool of tool.relatedTools) assert.ok(expectedIds.includes(relatedTool));
	}
});

test('Jede zentrale Toolroute besitzt eine Astro-Seite', () => {
	for (const tool of tools) {
		const route = tool.href.replace(/^\/tools\//, '').replace(/\/$/, '');
		assert.equal(existsSync(path.join(root, 'src', 'pages', 'tools', `${route}.astro`)), true, tool.href);
	}
	assert.equal(existsSync(path.join(root, 'src', 'pages', 'tools', 'index.astro')), true);
});
