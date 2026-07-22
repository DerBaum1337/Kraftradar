import { differenceInCalendarDays, isFutureDate } from './dates.mjs';

export function calculateEgymFortschritt(input) {
	const days = differenceInCalendarDays(input.firstDate, input.secondDate);
	if (
		days === null ||
		days <= 0 ||
		isFutureDate(input.firstDate, input.today) ||
		isFutureDate(input.secondDate, input.today) ||
		!Number.isFinite(input.firstValue) ||
		!Number.isFinite(input.secondValue) ||
		input.firstValue <= 0 ||
		input.secondValue <= 0
	) return null;

	const differenceKg = input.secondValue - input.firstValue;
	const differencePercent = (differenceKg / input.firstValue) * 100;
	const hasBothBodyWeights = Number.isFinite(input.firstBodyWeight)
		&& input.firstBodyWeight > 0
		&& Number.isFinite(input.secondBodyWeight)
		&& input.secondBodyWeight > 0;
	const relative = hasBothBodyWeights
		? {
			first: input.firstValue / input.firstBodyWeight,
			second: input.secondValue / input.secondBodyWeight,
		}
		: null;

	if (relative) {
		relative.differencePercent = ((relative.second - relative.first) / relative.first) * 100;
	}

	return {
		exercise: input.exercise,
		side: input.side,
		firstDate: input.firstDate,
		secondDate: input.secondDate,
		firstValue: input.firstValue,
		secondValue: input.secondValue,
		days,
		weeks: days / 7,
		differenceKg,
		differencePercent,
		status: differenceKg > 0 ? 'up' : differenceKg < 0 ? 'down' : 'same',
		perFourWeeks: days >= 28
			? {
				kg: (differenceKg / days) * 28,
				percent: (differencePercent / days) * 28,
			}
			: null,
		relative,
	};
}
