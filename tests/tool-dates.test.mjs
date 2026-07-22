import test from 'node:test';
import assert from 'node:assert/strict';
import { differenceInCalendarDays, isFutureDate, parseIsoDate } from '../src/lib/tools/dates.mjs';

test('ISO-Daten werden streng validiert', () => {
	assert.ok(parseIsoDate('2026-02-28'));
	assert.ok(parseIsoDate('2024-02-29'));
	assert.equal(parseIsoDate('2026-02-29'), null);
	assert.equal(parseIsoDate('2026-02-31'), null);
	assert.equal(parseIsoDate('26-02-28'), null);
});

test('Kalendertage bleiben bei Sommerzeit und Schaltjahr stabil', () => {
	assert.equal(differenceInCalendarDays('2026-03-28', '2026-03-30'), 2);
	assert.equal(differenceInCalendarDays('2024-02-28', '2024-03-01'), 2);
	assert.equal(differenceInCalendarDays('2026-01-02', '2026-01-01'), -1);
	assert.equal(differenceInCalendarDays('ungültig', '2026-01-01'), null);
});

test('Zukunftsprüfung verwendet den übergebenen Kalendertag', () => {
	const today = new Date(Date.UTC(2026, 6, 22));
	assert.equal(isFutureDate('2026-07-22', today), false);
	assert.equal(isFutureDate('2026-07-23', today), true);
});
