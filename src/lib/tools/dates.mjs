const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

export function parseIsoDate(value) {
	if (typeof value !== 'string' || !isoDatePattern.test(value)) return null;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) return null;
	return date;
}

export function differenceInCalendarDays(firstDate, secondDate) {
	const first = firstDate instanceof Date ? firstDate : parseIsoDate(firstDate);
	const second = secondDate instanceof Date ? secondDate : parseIsoDate(secondDate);
	if (!first || !second) return null;
	return Math.round((second.getTime() - first.getTime()) / dayInMilliseconds);
}

export function isFutureDate(value, today = new Date()) {
	const date = parseIsoDate(value);
	if (!date) return false;
	const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
	return date.getTime() > todayUtc;
}
