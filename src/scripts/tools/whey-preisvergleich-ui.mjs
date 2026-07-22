import { calculateWheyPreisvergleich } from '../../lib/tools/whey-preisvergleich.mjs';
import { formatNumber, parseGermanDecimal, roundForDisplay } from '../../lib/tools/numbers.mjs';
import { formatEuro, parseEuroToCents } from '../../lib/tools/money.mjs';
import { getDiscountFieldState } from '../../lib/tools/form-state.mjs';
import {
	appendHeading,
	appendParagraph,
	appendResultCards,
	clearFormErrors,
	clearChildren,
	enableCalculator,
	hideResultAfterInputChange,
	installDirtyState,
	makeElement,
	resetToolForm,
	showErrors,
	showResult,
} from './common-form.mjs';

function valueFrom(card, fieldName) {
	const field = card.querySelector('[data-field="' + fieldName + '"]');
	return field instanceof HTMLInputElement || field instanceof HTMLSelectElement ? field.value.trim() : '';
}

function decimalFrom(card, fieldName, min, max, errors, label, required = true) {
	const field = card.querySelector('[data-field="' + fieldName + '"]');
	if (!(field instanceof HTMLInputElement)) return null;
	const raw = field.value.trim();
	if (!raw) {
		if (required) errors.push({ targetId: field.id, message: label + ' fehlt.' });
		return null;
	}
	const value = parseGermanDecimal(raw, { min, max, maxDecimals: 2 });
	if (value === null) errors.push({ targetId: field.id, message: label + ' muss zwischen ' + min + ' und ' + max + ' liegen.' });
	return value;
}

function euroFrom(card, fieldName, max, errors, label, required = true) {
	const field = card.querySelector('[data-field="' + fieldName + '"]');
	if (!(field instanceof HTMLInputElement)) return null;
	const raw = field.value.trim();
	if (!raw) {
		if (required) errors.push({ targetId: field.id, message: label + ' fehlt.' });
		return null;
	}
	const cents = parseEuroToCents(raw);
	if (cents === null || cents > max * 100) {
		errors.push({ targetId: field.id, message: label + ' muss zwischen 0 und ' + max + ' € liegen.' });
		return null;
	}
	return cents;
}

function cardIsEmpty(card) {
	const hasProductInput = [...card.querySelectorAll('input[data-field]')].some((field) => {
		if (field.dataset.field === 'servingGrams') return field.value.trim() !== '30';
		return Boolean(field.value.trim());
	});
	const discountType = valueFrom(card, 'discountType');
	return !hasProductInput && (!discountType || discountType === 'none');
}

function updateProductNumbers(list) {
	list.querySelectorAll('[data-product-card]').forEach((card, index) => {
		const number = card.querySelector('[data-product-number]');
		if (number) number.textContent = 'Produkt ' + (index + 1);
		syncProductRequiredState(card, index);
		syncDiscountFieldState(card);
	});
}

function syncProductRequiredState(card, index) {
	const isRequired = index === 0 || !cardIsEmpty(card);
	for (const fieldName of ['powderGrams', 'proteinPer100', 'servingGrams', 'price']) {
		const field = card.querySelector('[data-field="' + fieldName + '"]');
		if (field instanceof HTMLInputElement) field.required = isRequired;
	}
}

function syncDiscountFieldState(card) {
	const type = valueFrom(card, 'discountType');
	const wrapper = card.querySelector('[data-discount-value-wrap]');
	const label = card.querySelector('[data-discount-label]');
	const unit = card.querySelector('[data-discount-unit]');
	const discount = card.querySelector('[data-field="discountValue"]');
	if (!(wrapper instanceof HTMLElement) || !(label instanceof HTMLElement) || !(unit instanceof HTMLElement)) return;
	wrapper.hidden = type === 'none';
	if (type === 'none' && discount instanceof HTMLInputElement) discount.value = '';
	label.textContent = type === 'fixed' ? 'Fester Rabatt' : 'Rabatt in Prozent';
	unit.textContent = type === 'fixed' ? '€' : '%';
	if (discount instanceof HTMLInputElement) {
		const state = getDiscountFieldState(type);
		discount.required = state.required;
		discount.disabled = state.disabled;
	}
}

function addRemoveButton(card) {
	const legend = card.querySelector('legend');
	if (!(legend instanceof HTMLElement)) return;
	const button = makeElement('button', {
		className: 'tool-remove-button',
		text: 'Produkt entfernen',
		attributes: { type: 'button', 'data-remove-product': '' },
	});
	legend.append(document.createTextNode(' '));
	legend.append(button);
}

function cloneProductCard(list, serial) {
	const source = list.querySelector('[data-product-card]');
	if (!(source instanceof HTMLElement)) return null;
	const clone = source.cloneNode(true);
	if (!(clone instanceof HTMLElement)) return null;
	clone.dataset.cardId = String(serial);
	clone.querySelectorAll('input').forEach((input) => {
		input.value = input.dataset.field === 'servingGrams' ? '30' : '';
		input.required = false;
		input.setAttribute('aria-invalid', 'false');
		if (input.id) input.id = input.id.replace(/-\d+-/, '-' + serial + '-');
	});
	clone.querySelectorAll('select').forEach((select) => {
		select.value = select.dataset.field === 'discountType' ? 'none' : '';
		if (select.id) select.id = select.id.replace(/-\d+-/, '-' + serial + '-');
	});
	clone.querySelectorAll('label[for]').forEach((label) => {
		label.htmlFor = label.htmlFor.replace(/-\d+-/, '-' + serial + '-');
	});
	clone.querySelectorAll('[data-error-for]').forEach((error) => {
		error.textContent = '';
	});
	clone.querySelectorAll('[data-remove-product]').forEach((button) => button.remove());
	addRemoveButton(clone);
	syncDiscountFieldState(clone);
	return clone;
}

function parseCard(card, index, errors) {
	if (index > 0 && cardIsEmpty(card)) return null;
	const name = valueFrom(card, 'name');
	const powderGrams = decimalFrom(card, 'powderGrams', 1, 50000, errors, 'Gesamtmenge Pulver');
	const proteinPer100 = decimalFrom(card, 'proteinPer100', 1, 100, errors, 'Protein pro 100 g');
	const servingGrams = decimalFrom(card, 'servingGrams', 1, 500, errors, 'Portionsgröße');
	const priceCents = euroFrom(card, 'price', 5000, errors, 'Produktpreis');
	const shippingCents = euroFrom(card, 'shipping', 500, errors, 'Versand', false) ?? 0;
	const discountType = valueFrom(card, 'discountType') || 'none';
	let discountValue = 0;
	if (discountType === 'percent') {
		discountValue = decimalFrom(card, 'discountValue', 0, 100, errors, 'Rabatt in Prozent');
	} else if (discountType === 'fixed') {
		discountValue = euroFrom(card, 'discountValue', 5000, errors, 'Fester Rabatt');
		if (discountValue !== null && priceCents !== null && discountValue > priceCents) {
			const field = card.querySelector('[data-field="discountValue"]');
			errors.push({ targetId: field?.id ?? 'whey-product-1-discount-value', message: 'Der feste Rabatt darf nicht höher als der Produktpreis sein.' });
		}
	}
	if (servingGrams !== null && powderGrams !== null && servingGrams > powderGrams) {
		const field = card.querySelector('[data-field="servingGrams"]');
		errors.push({ targetId: field?.id ?? 'whey-product-1-serving', message: 'Die Portionsgröße darf nicht größer als die Gesamtmenge sein.' });
	}
	if ([powderGrams, proteinPer100, servingGrams, priceCents, discountValue].some((value) => value === null)) return null;
	return { name, powderGrams, proteinPer100, servingGrams, priceCents, discountType, discountValue, shippingCents };
}

function renderResult(container, products) {
	clearChildren(container);
	const cheapestCount = products.filter((product) => product.flags.cheapestProtein).length;
	products.forEach((product) => {
		appendResultCards(container, [{
			title: product.name,
			items: [
				{ label: 'Effektiver Gesamtpreis', value: formatEuro(product.totalCents), emphasis: true },
				{ label: 'Preis pro kg', value: formatEuro(product.pricePerKgCents) },
				{ label: 'Gesamtprotein', value: formatNumber(roundForDisplay(product.totalProtein, 1), { maximumFractionDigits: 1 }) + ' g' },
				{ label: 'Portionen', value: formatNumber(roundForDisplay(product.portions, 1), { maximumFractionDigits: 1 }) },
				{ label: 'Protein pro Portion', value: formatNumber(roundForDisplay(product.proteinPerServing, 1), { maximumFractionDigits: 1 }) + ' g' },
				{ label: 'Preis pro Portion', value: formatEuro(product.pricePerServingCents) },
				{ label: 'Pulver für 25 g Protein', value: formatNumber(roundForDisplay(product.powderFor25Protein, 1), { maximumFractionDigits: 1 }) + ' g' },
				{ label: 'Preis pro 25 g Protein', value: formatEuro(product.pricePer25ProteinCents), emphasis: true },
			],
		}]);
		if (product.flags.cheapestProtein) {
			appendParagraph(container, cheapestCount > 1 ? product.name + ' liegt beim Preis pro 25 g Protein gleichauf.' : product.name + ' hat im Vergleich den niedrigsten Preis pro 25 g Protein.', 'tool-result-note');
		} else if (product.moreCostCents > 0) {
			const percentage = product.moreCostPercent === null ? '' : ' und ist damit rund ' + formatNumber(roundForDisplay(product.moreCostPercent, 0), { maximumFractionDigits: 0 }) + ' % teurer als das günstigste Produkt.';
			appendParagraph(container, product.name + ' kostet ' + formatEuro(product.moreCostCents) + ' mehr pro 25 g Protein' + percentage, 'tool-result-note');
		}
		const labels = [];
		if (product.flags.cheapestKilogram) labels.push('Niedrigster Kilopreis');
		if (product.flags.cheapestServing) labels.push('Günstigste Portion');
		if (labels.length > 0) appendParagraph(container, labels.join(' · '), 'tool-result-label');
	});
	appendHeading(container, 'Grenze des Vergleichs');
	appendParagraph(container, 'Was der Vergleich nicht bewertet: Ein niedriger Preis pro 25 g Protein sagt nichts über Geschmack, Löslichkeit, Zutaten, Herkunft, Aminosäureprofil, Laborprüfung oder Verträglichkeit aus. Die Berechnung verwendet ausschließlich deine Eingaben und den angegebenen Proteinwert des Herstellers.', 'tool-result-note');
}

export function initWheyPreisvergleichUi() {
	const form = document.querySelector('#whey-preisvergleich-form');
	if (!(form instanceof HTMLFormElement)) return;
	const list = form.querySelector('[data-product-list]');
	if (!(list instanceof HTMLElement)) return;
	let nextSerial = 2;
	enableCalculator(form);
	installDirtyState(form);
	updateProductNumbers(list);

	form.addEventListener('change', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const card = target.closest('[data-product-card]');
		if (!(card instanceof HTMLElement)) return;
		if (target instanceof HTMLSelectElement && target.dataset.field === 'discountType') syncDiscountFieldState(card);
		updateProductNumbers(list);
	});
	form.addEventListener('input', (event) => {
		if (!(event.target instanceof HTMLElement) || !event.target.closest('[data-product-card]')) return;
		updateProductNumbers(list);
	});

	form.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (target.matches('[data-add-product]')) {
			const cards = list.querySelectorAll('[data-product-card]');
			if (cards.length >= 4) return;
			const card = cloneProductCard(list, nextSerial++);
			if (!card) return;
			list.append(card);
			updateProductNumbers(list);
			card.querySelector('[data-field="name"]')?.focus();
			const addButton = form.querySelector('[data-add-product]');
			if (addButton instanceof HTMLButtonElement && list.querySelectorAll('[data-product-card]').length >= 4) addButton.disabled = true;
		}
		if (target.matches('[data-remove-product]')) {
			const card = target.closest('[data-product-card]');
			if (!(card instanceof HTMLElement)) return;
			const fallback = card.previousElementSibling?.querySelector('[data-field="name"]') ?? form.querySelector('[data-add-product]');
			card.remove();
			clearFormErrors(form);
			hideResultAfterInputChange(form);
			updateProductNumbers(list);
			const addButton = form.querySelector('[data-add-product]');
			if (addButton instanceof HTMLButtonElement) addButton.disabled = false;
			if (fallback instanceof HTMLElement) fallback.focus();
		}
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const errors = [];
		const products = [...list.querySelectorAll('[data-product-card]')]
			.map((card, index) => parseCard(card, index, errors))
			.filter(Boolean);
		if (products.length === 0) errors.push({ targetId: 'whey-product-1-powder', message: 'Gib mindestens ein vollständiges Whey-Produkt ein.' });
		if (errors.length > 0) {
			showErrors(form, errors);
			return;
		}
		const result = calculateWheyPreisvergleich(products);
		if (!result) {
			showErrors(form, [{ targetId: 'whey-product-1-powder', message: 'Die Produkte konnten nicht verglichen werden.' }]);
			return;
		}
		clearFormErrors(form);
		const container = showResult(form);
		if (container instanceof HTMLElement) renderResult(container, result);
	});

	const resetButton = form.querySelector('[data-reset]');
	resetButton?.addEventListener('click', () => {
		resetToolForm(form, () => {
			[...list.querySelectorAll('[data-product-card]')].slice(1).forEach((card) => card.remove());
			const first = list.querySelector('[data-product-card]');
			if (first instanceof HTMLElement) syncDiscountFieldState(first);
			updateProductNumbers(list);
			const addButton = form.querySelector('[data-add-product]');
			if (addButton instanceof HTMLButtonElement) addButton.disabled = false;
		});
	});
}
