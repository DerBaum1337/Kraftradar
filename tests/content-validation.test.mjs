import test from 'node:test';
import assert from 'node:assert/strict';
import { validateArticle } from '../scripts/content-validation.mjs';

const valid = `---
title: "Beispiel"
slug: beispiel-artikel
category: training
articleType: guide
status: published
description: "Beschreibung"
excerpt: "Auszug"
publishedAt: 2026-07-15
author: basti
---

## Abschnitt

Text.`;

test('akzeptiert einen vollständigen Ratgeber', () => {
	assert.deepEqual(validateArticle({ file: 'guide.md', source: valid }).errors, []);
});

test('lehnt einen nicht erlaubten Veröffentlichungsstatus ab', () => {
	const source = valid.replace('status: published', 'status: geheim');
	assert.ok(validateArticle({ file: 'draft.md', source }).errors.some((error) => error.includes('Veröffentlichungsstatus')));
});

test('lehnt eine H1 im Artikelinhalt ab', () => {
	const source = valid.replace('## Abschnitt', '# Zweite H1');
	assert.ok(validateArticle({ file: 'h1.md', source }).errors.some((error) => error.includes('H1')));
});

test('lehnt unsicheres HTML ab', () => {
	const source = `${valid}\n<script>alert(1)</script>`;
	assert.ok(validateArticle({ file: 'unsafe.md', source }).errors.some((error) => error.includes('Unsicheres')));
});

test('lehnt doppelte Slugs ab', () => {
	assert.ok(validateArticle({ file: 'duplicate.md', source: valid, knownSlugs: new Set(['beispiel-artikel']) }).errors.some((error) => error.includes('Doppelter')));
});

test('lehnt ein ungültiges Veröffentlichungsdatum ab', () => {
	const source = valid.replace('publishedAt: 2026-07-15', 'publishedAt: kein-datum');
	assert.ok(validateArticle({ file: 'date.md', source }).errors.some((error) => error.includes('Datum')));
});
