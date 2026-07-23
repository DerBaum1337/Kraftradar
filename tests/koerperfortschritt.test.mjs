import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateKoerperfortschritt } from '../src/lib/tools/koerperfortschritt.mjs';
import { getKoerperfortschrittCombinationText, getKoerperfortschrittHeroText } from '../src/scripts/tools/koerperfortschritt-ui.mjs';

test('Körpervergleich beschreibt zwei Messzeitpunkte neutral', () => {
	const result = calculateKoerperfortschritt({
		firstDate: '2026-01-01', secondDate: '2026-02-26',
		measurements: [
			{ key: 'weight', label: 'Gewicht', unit: 'kg', first: 80, second: 82 },
			{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 100, second: 96 },
			{ key: 'brust', label: 'Brustumfang', unit: 'cm', first: 98, second: 100 },
			{ key: 'huefte', label: 'Hüftumfang', unit: 'cm', first: 102, second: 101 },
			{ key: 'oberarm-links-angespannt', label: 'Oberarm links angespannt', unit: 'cm', first: 32, second: 32.5 },
		],
	});
	assert.equal(result.days, 56);
	assert.equal(result.weeks, 8);
	assert.deepEqual(result.counts, { larger: 3, smaller: 2, same: 0 });
	assert.equal(result.weight.difference, 2);
	assert.equal(result.waist.difference, -4);
});

test('der sichtbare Rundungswert bestimmt den neutralen Status', () => {
	const result = calculateKoerperfortschritt({
		firstDate: '2026-03-28', secondDate: '2026-03-30',
		measurements: [{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 100, second: 100.04 }],
	});
	assert.equal(result.measurements[0].status, 'same');
	assert.equal(result.measurements[0].visibleDifference, 0);
});

test('identische oder umgekehrte Tage sowie leere Messungen ergeben kein Ergebnis', () => {
	assert.equal(calculateKoerperfortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-01', measurements: [{ first: 1, second: 2 }] }), null);
	assert.equal(calculateKoerperfortschritt({ firstDate: '2026-01-02', secondDate: '2026-01-01', measurements: [{ first: 1, second: 2 }] }), null);
	assert.equal(calculateKoerperfortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-02', measurements: [] }), null);
});

test('eigene Maße und getrennte Körperseiten bleiben eigenständige Messpaare', () => {
	const customMeasures = Array.from({ length: 5 }, (_, index) => ({
		key: 'custom-' + index, label: 'Eigenes Maß ' + index, unit: 'cm', first: 10, second: 11,
	}));
	const custom = calculateKoerperfortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-02', measurements: customMeasures });
	assert.equal(custom.measurements.length, 5);
	assert.equal(calculateKoerperfortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-02', measurements: [...customMeasures, { key: 'custom-6', first: 10, second: 11 }] }), null);
	const sides = calculateKoerperfortschritt({
		firstDate: '2026-01-01', secondDate: '2026-01-02',
		measurements: [
			{ key: 'oberarm-links-entspannt', label: 'Oberarm links entspannt', unit: 'cm', first: 30, second: 31 },
			{ key: 'oberarm-rechts-entspannt', label: 'Oberarm rechts entspannt', unit: 'cm', first: 30, second: 30 },
			{ key: 'oberarm-links-angespannt', label: 'Oberarm links angespannt', unit: 'cm', first: 32, second: 33 },
		],
	});
	assert.equal(sides.measurements.length, 3);
	assert.equal(sides.measurements[0].key, 'oberarm-links-entspannt');
	assert.equal(sides.measurements[2].key, 'oberarm-links-angespannt');
});

test('unvollständige Paare werden abgelehnt und vollständige Kombinationen bleiben neutral', () => {
	assert.equal(calculateKoerperfortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-02', measurements: [{ key: 'bauch', first: 100, second: undefined }] }), null);
	assert.equal(calculateKoerperfortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-02', measurements: [{ key: 'bauch', first: undefined, second: 100 }] }), null);
	const weightOnly = calculateKoerperfortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-02', measurements: [{ key: 'weight', label: 'Gewicht', unit: 'kg', first: 80, second: 81 }] });
	assert.equal(weightOnly.measurements.length, 1);
	const waistOnly = calculateKoerperfortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-02', measurements: [{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 100, second: 99 }] });
	assert.equal(waistOnly.measurements.length, 1);
	const mixed = calculateKoerperfortschritt({
		firstDate: '2026-01-01', secondDate: '2026-01-02',
		measurements: [
			{ key: 'weight', label: 'Gewicht', unit: 'kg', first: 80, second: 82 },
			{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 100, second: 96 },
			{ key: 'brust', label: 'Brustumfang', unit: 'cm', first: 98, second: 100 },
			{ key: 'huefte', label: 'Hüfte', unit: 'cm', first: 102, second: 101 },
		],
	});
	assert.equal(mixed.weight.status, 'larger');
	assert.equal(mixed.waist.status, 'smaller');
	assert.deepEqual(mixed.counts, { larger: 2, smaller: 2, same: 0 });
	const reversed = calculateKoerperfortschritt({
		firstDate: '2026-01-01', secondDate: '2026-01-02',
		measurements: [
			{ key: 'weight', label: 'Gewicht', unit: 'kg', first: 82, second: 80 },
			{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 96, second: 100 },
		],
	});
	assert.equal(reversed.weight.status, 'smaller');
	assert.equal(reversed.waist.status, 'larger');
	const bothLarger = calculateKoerperfortschritt({
		firstDate: '2026-01-01', secondDate: '2026-01-02',
		measurements: [
			{ key: 'weight', label: 'Gewicht', unit: 'kg', first: 80, second: 82 },
			{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 96, second: 100 },
		],
	});
	assert.deepEqual(bothLarger.counts, { larger: 2, smaller: 0, same: 0 });
	const bothSmaller = calculateKoerperfortschritt({
		firstDate: '2026-01-01', secondDate: '2026-01-02',
		measurements: [
			{ key: 'weight', label: 'Gewicht', unit: 'kg', first: 82, second: 80 },
			{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 100, second: 96 },
		],
	});
	assert.deepEqual(bothSmaller.counts, { larger: 0, smaller: 2, same: 0 });
});

test('gerichtete Körperfortschrittssätze verwenden Beträge, während Differenzen ihr Vorzeichen behalten', () => {
	const weightUpBauchDown = calculateKoerperfortschritt({
		firstDate: '2026-01-01',
		secondDate: '2026-01-29',
		measurements: [
			{ key: 'weight', label: 'Gewicht', unit: 'kg', first: 80, second: 82 },
			{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 100, second: 96 },
		],
	});
	assert.equal(weightUpBauchDown.waist.difference, -4);
	assert.match(getKoerperfortschrittCombinationText(weightUpBauchDown), /um 2,0 kg gestiegen, während dein Bauchumfang um 4,0 cm kleiner gemessen wurde/);
	assert.doesNotMatch(getKoerperfortschrittCombinationText(weightUpBauchDown), /um -4,0 cm kleiner/);

	const weightDownBauchUp = calculateKoerperfortschritt({
		firstDate: '2026-01-01',
		secondDate: '2026-01-29',
		measurements: [
			{ key: 'weight', label: 'Gewicht', unit: 'kg', first: 82, second: 80 },
			{ key: 'bauch', label: 'Bauchumfang', unit: 'cm', first: 96, second: 100 },
		],
	});
	assert.equal(weightDownBauchUp.weight.difference, -2);
	assert.match(getKoerperfortschrittCombinationText(weightDownBauchUp), /um 2,0 kg gesunken, während dein Bauchumfang um 4,0 cm größer gemessen wurde/);
	assert.doesNotMatch(getKoerperfortschrittCombinationText(weightDownBauchUp), /um -2,0 kg gesunken/);
});


test('Körper-Ergebnis-Hero nennt größere, kleinere und unveränderte Werte vollständig', () => {
	assert.equal(getKoerperfortschrittHeroText({ larger: 3, smaller: 2, same: 1 }), '3 größer · 2 kleiner · 1 unverändert');
	assert.equal(getKoerperfortschrittHeroText({ larger: 2, smaller: 0, same: 0 }), '2 größer');
	assert.equal(getKoerperfortschrittHeroText({ larger: 0, smaller: 0, same: 1 }), '1 unverändert');
});
