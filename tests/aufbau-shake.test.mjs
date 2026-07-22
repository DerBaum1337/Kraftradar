import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAufbauShake } from '../src/lib/tools/aufbau-shake.mjs';

const ingredients = [
	{ name: 'Zutat A', amount: 50, caloriesPer100: 370, proteinPer100: 70, carbsPer100: 18, fatPer100: 2, priceCents: 2000, purchasedAmount: 1000 },
	{ name: 'Zutat B', amount: 250, caloriesPer100: 50, proteinPer100: 3, carbsPer100: 5, fatPer100: 2, priceCents: 120, purchasedAmount: 1000 },
];

test('Aufbau-Shake summiert Nährwerte und Kosten aus eigenen Eingaben', () => {
	const result = calculateAufbauShake({ ingredients, portions: 1, endVolume: 500 });
	assert.equal(result.totals.calories, 310);
	assert.equal(result.totals.protein, 42.5);
	assert.equal(result.totals.carbs, 21.5);
	assert.equal(result.totals.fat, 6);
	assert.equal(result.totalCostCents, 130);
	assert.equal(Math.round(result.costPer100CaloriesCents), 42);
	assert.equal(Math.round(result.costPer25ProteinCents), 76);
	assert.equal(result.caloriesPer100Ml, 62);
});

test('mehrere Portionen und Kostenplanung verwenden nur vollständige Preise', () => {
	const result = calculateAufbauShake({ ingredients, portions: 2, portionsPerWeek: 7 });
	assert.equal(result.perPortion.calories, 155);
	assert.equal(result.perPortion.protein, 21.25);
	assert.equal(result.perPortion.costCents, 65);
	assert.equal(Math.round(result.monthlyCostCents), 1972);
	const partial = calculateAufbauShake({ ingredients: [{ ...ingredients[0], priceCents: undefined, purchasedAmount: undefined }, ingredients[1]], portions: 1 });
	assert.equal(partial.costState, 'partial');
	assert.equal(partial.totalCostCents, null);
	assert.equal(partial.monthlyCostCents, null);
});

test('leere Zutatenlisten oder null Portionen ergeben kein Ergebnis', () => {
	assert.equal(calculateAufbauShake({ ingredients: [], portions: 1 }), null);
	assert.equal(calculateAufbauShake({ ingredients, portions: 0 }), null);
});

test('Zutatenanzahl und unvollständige Preispaare werden begrenzt', () => {
	const fifteen = Array.from({ length: 15 }, (_, index) => ({ ...ingredients[0], name: 'Zutat ' + index }));
	assert.equal(calculateAufbauShake({ ingredients: fifteen, portions: 1 }).ingredients.length, 15);
	assert.equal(calculateAufbauShake({ ingredients: [...fifteen, { ...ingredients[0], name: 'Zutat 16' }], portions: 1 }), null);
	assert.equal(calculateAufbauShake({ ingredients: [{ ...ingredients[0], priceCents: 0, purchasedAmount: 1000 }], portions: 1 }).totalCostCents, 0);
	assert.equal(calculateAufbauShake({ ingredients: [{ ...ingredients[0], priceCents: 100, purchasedAmount: undefined }], portions: 1 }), null);
	assert.equal(calculateAufbauShake({ ingredients: [{ ...ingredients[0], priceCents: undefined, purchasedAmount: 1000 }], portions: 1 }), null);
});

test('Kostenkennzahlen erscheinen nur bei vollständigen und passenden Nährwerten', () => {
	const partial = calculateAufbauShake({
		ingredients: [{ ...ingredients[0], priceCents: undefined, purchasedAmount: undefined }, ingredients[1]],
		portions: 1,
		portionsPerWeek: 7,
	});
	assert.equal(partial.costState, 'partial');
	assert.equal(partial.weeklyCostCents, null);
	assert.equal(partial.monthlyCostCents, null);
	const zeroNutrition = calculateAufbauShake({
		ingredients: [{ ...ingredients[0], caloriesPer100: 0, proteinPer100: 0 }],
		portions: 1,
	});
	assert.equal(zeroNutrition.costPer100CaloriesCents, null);
	assert.equal(zeroNutrition.costPer25ProteinCents, null);
	const split = calculateAufbauShake({ ingredients, portions: 2 });
	assert.equal(split.perPortion.calories, 155);
});
