import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWheyPreisvergleich } from '../src/lib/tools/whey-preisvergleich.mjs';
import { getWheyResultHero } from '../src/scripts/tools/whey-preisvergleich-ui.mjs';

const productA = {
	name: 'Produkt A', powderGrams: 900, proteinPer100: 75, servingGrams: 30,
	priceCents: 2799, discountType: 'none', shippingCents: 0,
};
const productB = {
	name: 'Produkt B', powderGrams: 1000, proteinPer100: 82, servingGrams: 30,
	priceCents: 3299, discountType: 'none', shippingCents: 0,
};

test('Wheywerte und Vergleichskennzeichnung werden korrekt berechnet', () => {
	const [a, b] = calculateWheyPreisvergleich([productA, productB]);
	assert.equal(a.totalProtein, 675);
	assert.equal(a.portions, 30);
	assert.equal(a.proteinPerServing, 22.5);
	assert.equal(a.pricePerServingCents, 93);
	assert.equal(a.pricePerKgCents, 3110);
	assert.equal(a.pricePer25ProteinCents, 104);
	assert.equal(b.totalProtein, 820);
	assert.equal(b.pricePer25ProteinCents, 101);
	assert.equal(b.flags.cheapestProtein, true);
	assert.equal(a.flags.cheapestProtein, false);
});

test('Rabatt und Versand fließen in den effektiven Gesamtpreis ein', () => {
	const [result] = calculateWheyPreisvergleich([{
		...productA, priceCents: 2999, discountType: 'percent', discountValue: 10, shippingCents: 499,
	}]);
	assert.equal(result.discountCents, 300);
	assert.equal(result.priceAfterDiscountCents, 2699);
	assert.equal(result.totalCents, 3198);
	assert.equal(result.pricePerKgCents, 3553);
	assert.equal(result.pricePer25ProteinCents, 118);
	const [fullyDiscounted] = calculateWheyPreisvergleich([{
		...productA, discountType: 'percent', discountValue: 100,
	}]);
	assert.equal(fullyDiscounted.priceAfterDiscountCents, 0);
});

test('feste Rabatte, kostenlose Angebote und Gleichstände bleiben deterministisch', () => {
	const fixed = calculateWheyPreisvergleich([{ ...productA, priceCents: 500, discountType: 'fixed', discountValue: 500 }])[0];
	assert.equal(fixed.priceAfterDiscountCents, 0);
	assert.equal(fixed.totalCents, 0);
	assert.equal(fixed.moreCostPercent, null);
	assert.equal(calculateWheyPreisvergleich([{ ...productA, priceCents: 500, discountType: 'fixed', discountValue: 501 }]), null);
	const ties = calculateWheyPreisvergleich([productA, { ...productA, name: 'Produkt C' }]);
	assert.equal(ties[0].flags.cheapestProtein, true);
	assert.equal(ties[1].flags.cheapestProtein, true);
});

test('Preis null, leerer Versand sowie bis zu vier Produkte werden korrekt behandelt', () => {
	const [free] = calculateWheyPreisvergleich([{ ...productA, priceCents: 0, shippingCents: undefined }]);
	assert.equal(free.totalCents, 0);
	assert.equal(free.pricePer25ProteinCents, 0);
	const products = calculateWheyPreisvergleich([productA, productB, { ...productA, name: 'Produkt C' }, { ...productB, name: 'Produkt D' }]);
	assert.equal(products.length, 4);
	assert.equal(calculateWheyPreisvergleich([productA, productB, productA, productB, productA]), null);
});

test('sichtbar gleiche Centwerte teilen sich die günstigste Protein-Kennzeichnung', () => {
	const products = calculateWheyPreisvergleich([productA, { ...productA, name: 'Produkt B', priceCents: 2800 }]);
	assert.equal(products[0].pricePer25ProteinCents, products[1].pricePer25ProteinCents);
	assert.equal(products[0].flags.cheapestProtein, true);
	assert.equal(products[1].flags.cheapestProtein, true);
	const afterRemoval = calculateWheyPreisvergleich([productB]);
	assert.equal(afterRemoval.length, 1);
	assert.equal(afterRemoval[0].name, 'Produkt B');
});


test('Whey-Ergebnis-Hero unterscheidet eindeutigen Bestwert und Gleichstand', () => {
	const unique = calculateWheyPreisvergleich([productA, productB]);
	assert.deepEqual(getWheyResultHero(unique), {
		value: '1,01 €',
		unit: 'Niedrigster Preis pro 25 g Protein',
		meta: 'Produkt B',
	});

	const ties = calculateWheyPreisvergleich([productA, { ...productA, name: 'Produkt C' }]);
	assert.deepEqual(getWheyResultHero(ties), {
		value: '1,04 €',
		unit: 'Niedrigster Preis pro 25 g Protein',
		meta: 'Gleichstand zwischen 2 Produkten',
	});
});
