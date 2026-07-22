import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEgymFortschritt } from '../src/lib/tools/egym-fortschritt.mjs';
import { getEgymSummary } from '../src/scripts/tools/egym-fortschritt-ui.mjs';

test('EGYM-Fortschritt wird als Veränderung einer einzelnen Übung berechnet', () => {
	const result = calculateEgymFortschritt({
		exercise: 'Beinpresse', side: 'beidseitig', firstDate: '2026-04-13', secondDate: '2026-06-08',
		firstValue: 175, secondValue: 185, firstBodyWeight: 85.6, secondBodyWeight: 87.1,
	});
	assert.equal(result.days, 56);
	assert.equal(result.weeks, 8);
	assert.equal(result.differenceKg, 10);
	assert.equal(Math.round(result.differencePercent * 10) / 10, 5.7);
	assert.equal(result.perFourWeeks.kg, 5);
	assert.equal(Math.round(result.relative.first * 100) / 100, 2.04);
	assert.equal(Math.round(result.relative.second * 100) / 100, 2.12);
	assert.equal(Math.round(result.relative.differencePercent * 10) / 10, 3.9);
	assert.equal(result.status, 'up');
});

test('gleiche und gesunkene Werte werden neutral beschrieben', () => {
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-29', firstValue: 100, secondValue: 100 }).status, 'same');
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-28', firstValue: 100, secondValue: 92 }).status, 'down');
});

test('Zeitgrenzen, Zukunft und ungültige Testwerte werden sicher behandelt', () => {
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-01', firstValue: 100, secondValue: 101 }), null);
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-02', secondDate: '2026-01-01', firstValue: 100, secondValue: 101 }), null);
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-07-22', secondDate: '2026-07-23', firstValue: 100, secondValue: 101, today: new Date(Date.UTC(2026, 6, 22)) }), null);
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-29', firstValue: 0, secondValue: 101 }), null);
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-29', firstValue: 100, secondValue: 0 }), null);
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-29', firstValue: -1, secondValue: 101 }), null);
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-29', firstValue: 100, secondValue: -1 }), null);
	assert.equal(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-28', firstValue: 100, secondValue: 105 }).perFourWeeks, null);
	assert.ok(calculateEgymFortschritt({ firstDate: '2026-01-01', secondDate: '2026-01-29', firstValue: 100, secondValue: 105 }).perFourWeeks);
});

test('relative Vergleiche benötigen zwei Gewichte und können anders verlaufen als absolute Werte', () => {
	const result = calculateEgymFortschritt({ firstDate: '2026-03-28', secondDate: '2026-04-24', firstValue: 100, secondValue: 105, firstBodyWeight: 80 });
	assert.equal(result.days, 27);
	assert.equal(result.perFourWeeks, null);
	assert.equal(result.relative, null);
	const secondOnly = calculateEgymFortschritt({ firstDate: '2026-03-28', secondDate: '2026-04-25', firstValue: 100, secondValue: 105, secondBodyWeight: 80 });
	assert.equal(secondOnly.relative, null);
	const absoluteUpRelativeDown = calculateEgymFortschritt({ firstDate: '2026-03-28', secondDate: '2026-04-25', firstValue: 100, secondValue: 110, firstBodyWeight: 50, secondBodyWeight: 60 });
	assert.equal(absoluteUpRelativeDown.status, 'up');
	assert.ok(absoluteUpRelativeDown.relative.differencePercent < 0);
	const absoluteDownRelativeUp = calculateEgymFortschritt({ firstDate: '2026-03-28', secondDate: '2026-04-25', firstValue: 100, secondValue: 90, firstBodyWeight: 50, secondBodyWeight: 40 });
	assert.equal(absoluteDownRelativeUp.status, 'down');
	assert.ok(absoluteDownRelativeUp.relative.differencePercent > 0);
});

test('gerichtete EGYM-Ergebnissätze verwenden bei sinkenden Werten den Betrag', () => {
	const result = calculateEgymFortschritt({
		exercise: 'Beinpresse',
		firstDate: '2026-01-01',
		secondDate: '2026-01-29',
		firstValue: 100,
		secondValue: 92,
	});

	assert.equal(result.differenceKg, -8);
	assert.match(getEgymSummary(result), /um 8,0 kg beziehungsweise 8,0 % gesunken/);
	assert.doesNotMatch(getEgymSummary(result), /um -8,0 kg gesunken/);
});
