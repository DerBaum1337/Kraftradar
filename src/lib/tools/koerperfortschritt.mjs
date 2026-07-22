import { differenceInCalendarDays } from './dates.mjs';
import { roundForDisplay } from './numbers.mjs';

export function calculateKoerperfortschritt(input) {
	const days = differenceInCalendarDays(input.firstDate, input.secondDate);
	if (days === null || days <= 0 || !Array.isArray(input.measurements) || input.measurements.length === 0) return null;
	const customMeasurements = input.measurements.filter((measurement) => String(measurement.key ?? '').startsWith('custom-'));
	if (customMeasurements.length > 5) return null;
	if (input.measurements.some((measurement) => {
		return !Number.isFinite(measurement.first) || measurement.first <= 0 || !Number.isFinite(measurement.second) || measurement.second <= 0;
	})) return null;
	const measurements = input.measurements.map((measurement) => {
		const difference = measurement.second - measurement.first;
		const visibleDifference = roundForDisplay(difference, 1);
		return {
			...measurement,
			difference,
			visibleDifference,
			differencePercent: (difference / measurement.first) * 100,
			status: visibleDifference > 0 ? 'larger' : visibleDifference < 0 ? 'smaller' : 'same',
		};
	});
	const counts = measurements.reduce((sum, measurement) => {
		sum[measurement.status] += 1;
		return sum;
	}, { larger: 0, smaller: 0, same: 0 });
	const weight = measurements.find((measurement) => measurement.key === 'weight') ?? null;
	const waist = measurements.find((measurement) => measurement.key === 'bauch' || measurement.key === 'taille') ?? null;

	return {
		days,
		weeks: days / 7,
		measurements,
		counts,
		weight,
		waist,
	};
}
