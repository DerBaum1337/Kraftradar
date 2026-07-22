const decimalPattern = /^\d+(?:[,.]\d+)?$/;

export function parseGermanDecimal(value, options = {}) {
	const {
		min = -Infinity,
		max = Infinity,
		maxDecimals = 6,
		integer = false,
	} = options;

	if (value === null || value === undefined) return null;
	const raw = String(value).trim();
	if (!raw || !decimalPattern.test(raw)) return null;
	const separator = raw.includes(',') ? ',' : raw.includes('.') ? '.' : null;
	if (separator) {
		const [integerPart, decimalPart] = raw.split(separator);
		if (decimalPart.length > maxDecimals) return null;
		// Drei Nachkommastellen nach einem von null verschiedenen Ganzzahlteil
		// sind in deutschen Toolformularen nicht eindeutig von einer Tausendergruppe
		// zu unterscheiden (zum Beispiel „1.000“). Solche Eingaben werden bewusst
		// nicht stillschweigend als Dezimalzahl interpretiert. Eindeutige kleine
		// Dezimalwerte wie „0,001“ bleiben bei entsprechend erlaubten Nachkommastellen gültig.
		if (decimalPart.length === 3 && Number(integerPart) !== 0) return null;
	}
	const parsed = Number(raw.replace(',', '.'));
	if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed))) return null;
	if (parsed < min || parsed > max) return null;
	return parsed;
}

export function formatNumber(value, options = {}) {
	if (!Number.isFinite(value)) return '–';
	return new Intl.NumberFormat('de-DE', options).format(value);
}

export function roundForDisplay(value, decimals = 0) {
	const factor = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function isWithinRange(value, min, max) {
	return Number.isFinite(value) && value >= min && value <= max;
}
