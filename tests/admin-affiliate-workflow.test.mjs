import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('admin exposes one optional affiliate object with Amazon and HSN', () => {
	const config = read('public/admin/config.yml');
	assert.match(config, /label: Affiliate-Box anzeigen/);
	assert.match(config, /name: affiliate/);
	assert.match(config, /typeKey: partner/);
	assert.match(config, /name: amazon/);
	assert.match(config, /name: hsn/);
	assert.match(config, /name: linkText/);
	assert.doesNotMatch(config, /label: Affiliate-Links, name: affiliateLinks, widget: boolean/);
});

test('affiliate schema and layout use the new top-level object', () => {
	const schema = read('src/content.config.ts');
	const layout = read('src/layouts/ArtikelLayout.astro');
	assert.match(schema, /const affiliateSchema = z\.object/);
	assert.match(schema, /partner: z\.enum\(\['amazon', 'hsn'\]\)/);
	assert.match(schema, /affiliate: affiliateSchema\.optional\(\)/);
	assert.match(layout, /data\.affiliate/);
	assert.match(layout, /partner=\{data\.affiliate\.partner\}/);
});

test('affiliate component contains precise partner-specific copy and safe link attributes', () => {
	const component = read('src/components/AffiliateProduktbox.astro');
	assert.match(component, /Als Amazon-Partner verdiene ich an qualifizierten Verkäufen/);
	assert.match(component, /Wenn du über diesen Link kaufst/);
	assert.match(component, /keine zusätzlichen Kosten/);
	assert.doesNotMatch(component, /Für dich (?:bleibt|ändert sich) der Preis/);
	assert.match(component, /rel="sponsored noopener noreferrer"/);
	assert.match(component, /Bei \{partnerName\} ansehen/);
});

test('existing HSN articles and the Amazon shaker use the automatic box', () => {
	const hsnFiles = [
		'hsn-creatin-monohydrat-200-mesh-test.md',
		'hsn-evowhey-vanille-test.md',
		'hsn-kollagen-hydrolysat-rind-test.md',
		'hsn-magnesium-bisglycinat-175-mg-test.md',
		'hsn-maltodextrin-pulver-test.md',
		'hsn-multivitamine-fuer-maenner-test.md',
		'hsn-ultra-omega-3-tg-test.md',
	];
	for (const filename of hsnFiles) {
		const article = read(`src/content/articles/supplements/${filename}`);
		assert.match(article, /affiliate:\n  partner: hsn\n/);
		assert.match(article, /linkText: "HSN /);
		assert.match(article, /keine zusätzlichen Kosten/);
		assert.doesNotMatch(article, /Für dich (?:bleibt|ändert sich) der Preis/);
	}

	const shaker = read('src/content/articles/gym-zubehoer/720dgree-ubershaker-test.md');
	assert.match(shaker, /affiliate:\n  partner: amazon\n/);
	assert.match(shaker, /url: https:\/\/amzn\.to\/4wc4hTU/);
	assert.match(shaker, /keine zusätzlichen Kosten/);
	assert.doesNotMatch(shaker, /Für dich (?:bleibt|ändert sich) der Preis/);
	assert.doesNotMatch(shaker, /\*\*Produktlink:\*\* \[720°DGREE uberShaker/);
});

test('privacy page explains HSN and Amazon affiliate links precisely', () => {
	const privacy = read('src/pages/datenschutz.astro');
	assert.match(privacy, /Affiliate-Links zu HSN und Amazon/);
	assert.match(privacy, /Partnerkennung/);
	assert.match(privacy, /transaktionsbezogene Angaben/);
	assert.match(privacy, /keine zusätzlichen Kosten/);
	assert.match(privacy, /Als Amazon-Partner verdiene ich an qualifizierten Verkäufen/);
	assert.match(privacy, /nodeId=201909010/);
	assert.match(privacy, /nodeId=201890250/);
	assert.match(privacy, /hsnstore\.de\/datenschutzerklaerung/);
	assert.match(privacy, /hsnstore\.de\/cookies-richtlinien/);
	assert.doesNotMatch(privacy, /bleibt der Preis nach aktuellem Kenntnisstand gleich/);
});
