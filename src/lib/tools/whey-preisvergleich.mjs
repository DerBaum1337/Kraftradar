import { applyPercentageDiscount } from './money.mjs';

function calculateProduct(product, index) {
	const priceCents = product.priceCents;
	const shippingCents = product.shippingCents ?? 0;
	if (
		!Number.isFinite(product.powderGrams) || product.powderGrams <= 0 ||
		!Number.isFinite(product.proteinPer100) || product.proteinPer100 <= 0 ||
		!Number.isFinite(product.servingGrams) || product.servingGrams <= 0 || product.servingGrams > product.powderGrams ||
		!Number.isFinite(priceCents) || priceCents < 0 ||
		!Number.isFinite(shippingCents) || shippingCents < 0
	) return null;
	let discountCents = 0;

	if (product.discountType === 'percent') {
		discountCents = applyPercentageDiscount(priceCents, product.discountValue);
		if (discountCents === null) return null;
	} else if (product.discountType === 'fixed') {
		if (!Number.isFinite(product.discountValue) || product.discountValue < 0 || product.discountValue > priceCents) return null;
		discountCents = product.discountValue;
	} else if (product.discountType !== 'none' && product.discountType !== undefined) {
		return null;
	}

	const priceAfterDiscountCents = priceCents - discountCents;
	const totalCents = priceAfterDiscountCents + shippingCents;
	const totalProtein = product.powderGrams * (product.proteinPer100 / 100);
	const portions = product.powderGrams / product.servingGrams;
	const proteinPerServing = product.servingGrams * (product.proteinPer100 / 100);
	const pricePerServingCents = Math.round(totalCents / portions);
	const pricePerKgCents = Math.round((totalCents / product.powderGrams) * 1000);
	const powderFor25Protein = 25 / (product.proteinPer100 / 100);
	const pricePer25ProteinCents = Math.round((totalCents / totalProtein) * 25);

	return {
		...product,
		index,
		name: product.name?.trim() || 'Produkt ' + index,
		discountCents,
		priceAfterDiscountCents,
		totalCents,
		totalProtein,
		portions,
		proteinPerServing,
		pricePerServingCents,
		pricePerKgCents,
		powderFor25Protein,
		pricePer25ProteinCents,
	};
}

export function calculateWheyPreisvergleich(products) {
	if (!Array.isArray(products) || products.length === 0 || products.length > 4) return null;
	const calculatedProducts = products.map((product, index) => calculateProduct(product, index + 1));
	if (calculatedProducts.some((product) => product === null)) return null;
	const cheapestProtein = Math.min(...calculatedProducts.map((product) => product.pricePer25ProteinCents));
	const cheapestKilogram = Math.min(...calculatedProducts.map((product) => product.pricePerKgCents));
	const cheapestServing = Math.min(...calculatedProducts.map((product) => product.pricePerServingCents));

	return calculatedProducts.map((product) => {
		const proteinTie = product.pricePer25ProteinCents === cheapestProtein;
		const differenceCents = product.pricePer25ProteinCents - cheapestProtein;
		return {
			...product,
			flags: {
				cheapestProtein: proteinTie,
				cheapestKilogram: product.pricePerKgCents === cheapestKilogram,
				cheapestServing: product.pricePerServingCents === cheapestServing,
			},
			moreCostCents: differenceCents,
			moreCostPercent: cheapestProtein > 0 ? (differenceCents / cheapestProtein) * 100 : null,
		};
	});
}
