import { parseGermanDecimal } from './numbers.mjs';

export function parseEuroToCents(value) {
	const amount = parseGermanDecimal(value, { min: 0, max: 5000, maxDecimals: 2 });
	return amount === null ? null : Math.round((amount + Number.EPSILON) * 100);
}

export function formatEuro(cents) {
	if (!Number.isFinite(cents)) return '–';
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(cents / 100);
}

export function applyPercentageDiscount(priceCents, percentage) {
	if (!Number.isInteger(priceCents) || priceCents < 0 || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
		return null;
	}
	return Math.round((priceCents * percentage) / 100);
}
