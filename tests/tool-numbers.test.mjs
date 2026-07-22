import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, isWithinRange, parseGermanDecimal, roundForDisplay } from '../src/lib/tools/numbers.mjs';

test('parseGermanDecimal akzeptiert eindeutige deutsche und internationale Dezimalwerte', () => {
	assert.equal(parseGermanDecimal('87'), 87);
	assert.equal(parseGermanDecimal('87,1'), 87.1);
	assert.equal(parseGermanDecimal('87.1'), 87.1);
	assert.equal(parseGermanDecimal('0'), 0);
	assert.equal(parseGermanDecimal(' 0,5 '), 0.5);
});

test('parseGermanDecimal lehnt leere und mehrdeutige Eingaben ab', () => {
	for (const value of ['', ' ', '1.000', '1,000', '1.000,50', '1,000.50', '1e3', 'Infinity', 'NaN', '--5', '5,2,1']) {
		assert.equal(parseGermanDecimal(value), null, value);
	}
	assert.equal(parseGermanDecimal('0,001'), 0.001);
	assert.equal(parseGermanDecimal('0.001'), 0.001);
});

test('parseGermanDecimal beachtet Bereich, Ganzzahl und Nachkommastellen', () => {
	assert.equal(parseGermanDecimal('-5'), null);
	assert.equal(parseGermanDecimal('3,141', { maxDecimals: 2 }), null);
	assert.equal(parseGermanDecimal('3,14', { integer: true }), null);
	assert.equal(parseGermanDecimal('301', { min: 30, max: 300 }), null);
	assert.equal(parseGermanDecimal('30', { min: 30, max: 300 }), 30);
});

test('Zahlenformatierung und Rundung bleiben nachvollziehbar', () => {
	assert.equal(roundForDisplay(1.005, 2), 1.01);
	assert.equal(formatNumber(87.1, { maximumFractionDigits: 1 }), '87,1');
	assert.equal(isWithinRange(5, 0, 5), true);
	assert.equal(isWithinRange(Number.NaN, 0, 5), false);
});
