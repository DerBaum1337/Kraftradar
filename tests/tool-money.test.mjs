import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPercentageDiscount, formatEuro, parseEuroToCents } from '../src/lib/tools/money.mjs';

test('Eurobeträge werden als Cent ohne Gleitkommafehler verarbeitet', () => {
	assert.equal(parseEuroToCents('29,99'), 2999);
	assert.equal(parseEuroToCents('29.99'), 2999);
	assert.equal(parseEuroToCents('0'), 0);
	assert.equal(formatEuro(2999), '29,99 €');
});

test('ungültige Geldbeträge werden abgelehnt', () => {
	for (const value of ['', '-1', '1,234', '1.000,50', 'NaN', 'Infinity']) {
		assert.equal(parseEuroToCents(value), null, value);
	}
});

test('prozentuale Rabatte werden auf Cent gerundet und begrenzt', () => {
	assert.equal(applyPercentageDiscount(2999, 10), 300);
	assert.equal(applyPercentageDiscount(1, 50), 1);
	assert.equal(applyPercentageDiscount(100, 100), 100);
	assert.equal(applyPercentageDiscount(100, 101), null);
	assert.equal(applyPercentageDiscount(-1, 10), null);
});
