function calculateIngredient(ingredient) {
	const hasPriceValue = Number.isFinite(ingredient.priceCents);
	const hasPurchasedAmount = Number.isFinite(ingredient.purchasedAmount);
	if (
		!Number.isFinite(ingredient.amount) || ingredient.amount <= 0 ||
		!Number.isFinite(ingredient.caloriesPer100) || ingredient.caloriesPer100 < 0 ||
		!Number.isFinite(ingredient.proteinPer100) || ingredient.proteinPer100 < 0 ||
		!Number.isFinite(ingredient.carbsPer100) || ingredient.carbsPer100 < 0 ||
		!Number.isFinite(ingredient.fatPer100) || ingredient.fatPer100 < 0 ||
		(hasPriceValue !== hasPurchasedAmount) ||
		(hasPriceValue && (ingredient.priceCents < 0 || ingredient.purchasedAmount <= 0))
	) return null;
	const factor = ingredient.amount / 100;
	const calories = ingredient.caloriesPer100 * factor;
	const protein = ingredient.proteinPer100 * factor;
	const carbs = ingredient.carbsPer100 * factor;
	const fat = ingredient.fatPer100 * factor;
	const hasPrice = hasPriceValue && hasPurchasedAmount;
	const costCents = hasPrice ? (ingredient.priceCents / ingredient.purchasedAmount) * ingredient.amount : null;
	return { ...ingredient, calories, protein, carbs, fat, hasPrice, costCents };
}

export function calculateAufbauShake(input) {
	if (!Array.isArray(input.ingredients) || input.ingredients.length === 0 || input.ingredients.length > 15 || !Number.isFinite(input.portions) || input.portions <= 0) {
		return null;
	}
	const ingredients = input.ingredients.map(calculateIngredient);
	if (ingredients.some((ingredient) => ingredient === null)) return null;
	const totals = ingredients.reduce((sum, ingredient) => ({
		calories: sum.calories + ingredient.calories,
		protein: sum.protein + ingredient.protein,
		carbs: sum.carbs + ingredient.carbs,
		fat: sum.fat + ingredient.fat,
	}), { calories: 0, protein: 0, carbs: 0, fat: 0 });
	const pricedIngredients = ingredients.filter((ingredient) => ingredient.hasPrice);
	const knownCostCents = pricedIngredients.reduce((sum, ingredient) => sum + ingredient.costCents, 0);
	const costState = pricedIngredients.length === 0
		? 'none'
		: pricedIngredients.length === ingredients.length ? 'complete' : 'partial';
	const totalCostCents = costState === 'complete' ? knownCostCents : null;
	const portions = input.portions;
	const perPortion = {
		calories: totals.calories / portions,
		protein: totals.protein / portions,
		carbs: totals.carbs / portions,
		fat: totals.fat / portions,
		costCents: totalCostCents === null ? null : totalCostCents / portions,
	};
	const weeklyCostCents = costState === 'complete' && Number.isFinite(input.portionsPerWeek)
		? perPortion.costCents * input.portionsPerWeek
		: null;
	const monthlyCostCents = weeklyCostCents === null ? null : (weeklyCostCents * 52) / 12;

	return {
		recipeName: input.recipeName?.trim() || 'Dein Aufbau-Shake',
		portions,
		ingredients,
		totals,
		perPortion,
		costState,
		knownCostCents,
		totalCostCents,
		weeklyCostCents,
		monthlyCostCents,
		costPer100CaloriesCents: costState === 'complete' && perPortion.calories > 0
			? (perPortion.costCents / perPortion.calories) * 100 : null,
		costPer25ProteinCents: costState === 'complete' && perPortion.protein > 0
			? (perPortion.costCents / perPortion.protein) * 25 : null,
		calorieTargetDifference: Number.isFinite(input.calorieTarget)
			? perPortion.calories - input.calorieTarget : null,
		endVolume: Number.isFinite(input.endVolume) ? input.endVolume : null,
		caloriesPer100Ml: Number.isFinite(input.endVolume) && input.endVolume > 0
			? (totals.calories / input.endVolume) * 100 : null,
		volumePerPortion: Number.isFinite(input.endVolume) && input.endVolume > 0
			? input.endVolume / portions : null,
	};
}
