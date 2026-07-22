export const proteinGoals = Object.freeze({
	alltag: { min: 0.8, max: 0.8, label: 'Alltag ohne gezielten Muskelaufbau' },
	training: { min: 1.2, max: 1.6, label: 'Ambitioniertes regelmäßiges Training' },
	muskelaufbau: { min: 1.6, max: 2, label: 'Muskelaufbau mit Krafttraining' },
	defizit: { min: 1.6, max: 2, label: 'Muskelerhalt im Kaloriendefizit' },
});

export function calculateProteinbedarf(input) {
	const goal = proteinGoals[input.goal];
	if (!goal || !Number.isFinite(input.weight) || input.weight <= 0 || input.weight > 300) return null;

	const minimum = input.weight * goal.min;
	const maximum = input.weight * goal.max;
	const existingProtein = Number.isFinite(input.existingProtein) ? input.existingProtein : null;
	const wheyProteinPer100 = Number.isFinite(input.wheyProteinPer100) ? input.wheyProteinPer100 : null;
	const servingSize = Number.isFinite(input.servingSize) ? input.servingSize : null;
	let state = 'target-only';
	let missingProtein = null;
	let whey = null;

	if (existingProtein !== null) {
		if (existingProtein < minimum) {
			state = 'below';
			missingProtein = minimum - existingProtein;
			if (wheyProteinPer100 !== null && wheyProteinPer100 > 0 && servingSize !== null && servingSize > 0) {
				const powderGrams = missingProtein / (wheyProteinPer100 / 100);
				whey = {
					powderGrams,
					servings: powderGrams / servingSize,
				};
			}
		} else if (existingProtein <= maximum) {
			state = 'within';
			missingProtein = 0;
		} else {
			state = 'above';
			missingProtein = 0;
		}
	}

	return {
		goal,
		weight: input.weight,
		minimum,
		maximum,
		existingProtein,
		wheyProteinPer100,
		servingSize,
		state,
		missingProtein,
		whey,
	};
}
