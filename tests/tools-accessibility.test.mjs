import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolPages = [
	'proteinbedarf-rechner.astro',
	'whey-preisvergleich.astro',
	'egym-fortschrittsrechner.astro',
	'aufbau-shake-rechner.astro',
	'koerperfortschritt-auswerten.astro',
];

function pageSource(file) {
	return readFileSync(path.join(root, 'src', 'pages', 'tools', file), 'utf8');
}

test('jede Toolseite erklärt sichtbare Pflichtfelder und markiert statische Pflichtfelder programmatisch', () => {
	for (const file of toolPages) {
		const source = pageSource(file);
		assert.match(source, /Mit <span aria-hidden="true">\*<\/span> gekennzeichnete Felder sind Pflichtfelder\./, file);
	}
	for (const [file, ids] of Object.entries({
		'proteinbedarf-rechner.astro': ['protein-weight'],
		'whey-preisvergleich.astro': ['whey-product-1-powder', 'whey-product-1-protein', 'whey-product-1-serving', 'whey-product-1-price'],
		'egym-fortschrittsrechner.astro': ['egym-exercise', 'egym-first-date', 'egym-first-value', 'egym-second-date', 'egym-second-value', 'egym-confirmed'],
		'aufbau-shake-rechner.astro': ['shake-portions', 'shake-ingredient-1-name', 'shake-ingredient-1-basis', 'shake-ingredient-1-amount', 'shake-ingredient-1-kcal', 'shake-ingredient-1-protein', 'shake-ingredient-1-carbs', 'shake-ingredient-1-fat'],
		'koerperfortschritt-auswerten.astro': ['body-first-date', 'body-second-date', 'body-confirmed'],
	})) {
		const source = pageSource(file);
		for (const id of ids) {
			assert.match(source, new RegExp('<(?:input|select)[^>]*id="' + id + '"[^>]*\\brequired\\b'), file + ': ' + id);
		}
	}
});

test('statische Inlinefehler zeigen auf reale Ziele derselben Toolseite', () => {
	for (const file of toolPages) {
		const source = pageSource(file);
		const ids = new Set([...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
		for (const match of source.matchAll(/data-error-for="([^"]+)"/g)) {
			assert.equal(ids.has(match[1]), true, file + ': ' + match[1]);
		}
	}
});

test('die gemeinsame Fehlerdarstellung verwendet Ziel-IDs und sichere Fehlerlinks', () => {
	const source = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'common-form.mjs'), 'utf8');
	assert.match(source, /targetId/);
	assert.match(source, /href: '#' \+ error\.targetId/);
	assert.match(source, /target\.focus\(\)/);
	assert.match(source, /removeAttribute\('aria-invalid'\)/);
	assert.match(source, /element\.hidden = true/);
	assert.match(source, /clearChildren\(list\)/);
	assert.doesNotMatch(source, /\binnerHTML\b/);
});

test('dynamische Karten behalten nur bei tatsächlichen Eingaben ihre Pflichtsemantik', () => {
	const wheyUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'whey-preisvergleich-ui.mjs'), 'utf8');
	const shakeUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'aufbau-shake-ui.mjs'), 'utf8');
	const bodyUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'koerperfortschritt-ui.mjs'), 'utf8');
	assert.match(wheyUi, /index === 0 \|\| !cardIsEmpty\(card\)/);
	assert.match(wheyUi, /getDiscountFieldState/);
	assert.match(wheyUi, /discount\.disabled = state\.disabled/);
	assert.match(shakeUi, /index === 0 \|\| !cardIsEmpty\(card\)/);
	assert.match(shakeUi, /field\.required = hasPriceData/);
	assert.match(bodyUi, /syncMeasurementRequiredState/);
	assert.match(bodyUi, /syncAllMeasurementRequiredStates/);
});

test('alle Erfolgswege bereinigen alte Fehler vor der Ergebnisausgabe', () => {
	for (const file of [
		'proteinbedarf-ui.mjs',
		'whey-preisvergleich-ui.mjs',
		'egym-fortschritt-ui.mjs',
		'aufbau-shake-ui.mjs',
		'koerperfortschritt-ui.mjs',
	]) {
		const source = readFileSync(path.join(root, 'src', 'scripts', 'tools', file), 'utf8');
		assert.match(source, /clearFormErrors\(form\);\s*const container = showResult\(form\);/, file);
	}
});

test('dynamische Toolkarten begrenzen ihre Anzahl und behandeln leere Zusatzkarten gesondert', () => {
	const wheyUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'whey-preisvergleich-ui.mjs'), 'utf8');
	const shakeUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'aufbau-shake-ui.mjs'), 'utf8');
	const bodyUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'koerperfortschritt-ui.mjs'), 'utf8');
	assert.match(wheyUi, /if \(index > 0 && cardIsEmpty\(card\)\) return null/);
	assert.match(wheyUi, /if \(cards\.length >= 4\) return/);
	assert.match(wheyUi, /data-remove-product/);
	assert.match(shakeUi, /if \(index > 0 && cardIsEmpty\(card\)\) return null/);
	assert.match(shakeUi, /querySelectorAll\('\[data-ingredient-card\]'\)\.length >= 15\) return/);
	assert.match(shakeUi, /data-remove-ingredient/);
	assert.match(bodyUi, /length >= 5\) return/);
	assert.match(bodyUi, /data-remove-custom-measurement/);
});

test('das Entfernen dynamischer Karten bereinigt Fehlerzustände und behandelt Ergebnisse als veraltet', () => {
	const wheyUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'whey-preisvergleich-ui.mjs'), 'utf8');
	const shakeUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'aufbau-shake-ui.mjs'), 'utf8');
	const bodyUi = readFileSync(path.join(root, 'src', 'scripts', 'tools', 'koerperfortschritt-ui.mjs'), 'utf8');

	for (const [source, removeSelector, numberUpdate] of [
		[wheyUi, 'data-remove-product', 'updateProductNumbers'],
		[shakeUi, 'data-remove-ingredient', 'updateIngredientNumbers'],
		[bodyUi, 'data-remove-custom-measurement', 'updateCustomMeasurementNumbers'],
	]) {
		const removeBlock = source.slice(source.indexOf("target.matches('[" + removeSelector + "]')"));
		assert.match(removeBlock, /card\.remove\(\);\s*clearFormErrors\(form\);\s*hideResultAfterInputChange\(form\);/);
		assert.match(removeBlock, new RegExp(numberUpdate + '\\('));
		assert.match(removeBlock, /fallback instanceof HTMLElement\) fallback\.focus\(\)/);
	}
});
