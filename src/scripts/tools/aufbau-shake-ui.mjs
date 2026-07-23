import { calculateAufbauShake } from '../../lib/tools/aufbau-shake.mjs';
import { formatNumber, parseGermanDecimal, roundForDisplay } from '../../lib/tools/numbers.mjs';
import { formatEuro, parseEuroToCents } from '../../lib/tools/money.mjs';
import {
	appendHeading,
	appendList,
	appendParagraph,
	appendResultCards,
	appendResultHero,
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

function getInput(card, fieldName) {
	return card.querySelector('[data-field="' + fieldName + '"]');
}

function raw(card, fieldName) {
	const field = getInput(card, fieldName);
	return field instanceof HTMLInputElement || field instanceof HTMLSelectElement ? field.value.trim() : '';
}

function cardIsEmpty(card) {
	return [...card.querySelectorAll('[data-field]')].every((field) => {
		return !(field instanceof HTMLInputElement || field instanceof HTMLSelectElement) || !field.value.trim();
	});
}

function numberValue(card, fieldName, min, max, errors, label, required = true) {
	const field = getInput(card, fieldName);
	if (!(field instanceof HTMLInputElement)) return null;
	if (!field.value.trim()) {
		if (required) errors.push({ targetId: field.id, message: label + ' fehlt.' });
		return null;
	}
	const value = parseGermanDecimal(field.value, { min, max, maxDecimals: 2 });
	if (value === null) errors.push({ targetId: field.id, message: label + ' muss zwischen ' + min + ' und ' + max + ' liegen.' });
	return value;
}

function euroValue(card, fieldName, errors, label) {
	const field = getInput(card, fieldName);
	if (!(field instanceof HTMLInputElement)) return null;
	const cents = parseEuroToCents(field.value);
	if (cents === null) errors.push({ targetId: field.id, message: label + ' muss zwischen 0 und 5.000 € liegen.' });
	return cents;
}

function updateIngredientNumbers(list) {
	list.querySelectorAll('[data-ingredient-card]').forEach((card, index) => {
		const number = card.querySelector('[data-ingredient-number]');
		if (number) number.textContent = 'Zutat ' + (index + 1);
		syncIngredientRequiredState(card, index);
	});
}

function syncIngredientRequiredState(card, index) {
	const isRequired = index === 0 || !cardIsEmpty(card);
	for (const fieldName of ['name', 'amount', 'caloriesPer100', 'proteinPer100', 'carbsPer100', 'fatPer100']) {
		const field = getInput(card, fieldName);
		if (field instanceof HTMLInputElement) field.required = isRequired;
	}
	const basis = getInput(card, 'basis');
	if (basis instanceof HTMLSelectElement) basis.required = isRequired;
	const hasPriceData = Boolean(raw(card, 'price') || raw(card, 'purchasedAmount'));
	for (const fieldName of ['price', 'purchasedAmount']) {
		const field = getInput(card, fieldName);
		if (field instanceof HTMLInputElement) field.required = hasPriceData;
	}
}

function updateUnits(card) {
	const basis = raw(card, 'basis');
	const unit = basis === 'ml' ? 'ml' : basis === 'g' ? 'g' : 'g/ml';
	const perHundred = basis === 'ml' ? '100 ml' : basis === 'g' ? '100 g' : '100 g/ml';
	card.querySelectorAll('[data-unit-label], [data-purchased-unit]').forEach((element) => {
		element.textContent = unit;
	});
	card.querySelectorAll('[data-nutrition-heading]').forEach((element) => {
		element.textContent = 'Nährwerte pro ' + perHundred;
	});
	const nutrientLabels = {
		energy: 'Energie',
		protein: 'Protein',
		carbs: 'Kohlenhydrate',
		fat: 'Fett',
	};
	card.querySelectorAll('[data-nutrient-label]').forEach((element) => {
		const label = nutrientLabels[element.dataset.nutrientLabel];
		if (label) element.textContent = label + ' pro ' + perHundred;
	});
}

function addRemoveButton(card) {
	const legend = card.querySelector('legend');
	if (!(legend instanceof HTMLElement)) return;
	const button = makeElement('button', {
		className: 'tool-remove-button',
		text: 'Zutat entfernen',
		attributes: { type: 'button', 'data-remove-ingredient': '' },
	});
	legend.append(document.createTextNode(' '));
	legend.append(button);
}

function cloneIngredientCard(list, serial) {
	const source = list.querySelector('[data-ingredient-card]');
	if (!(source instanceof HTMLElement)) return null;
	const clone = source.cloneNode(true);
	if (!(clone instanceof HTMLElement)) return null;
	clone.dataset.cardId = String(serial);
	clone.querySelectorAll('input').forEach((input) => {
		input.value = '';
		input.required = false;
		input.setAttribute('aria-invalid', 'false');
		input.id = input.id.replace(/-\d+-/, '-' + serial + '-');
	});
	clone.querySelectorAll('select').forEach((select) => {
		select.value = '';
		select.id = select.id.replace(/-\d+-/, '-' + serial + '-');
	});
	clone.querySelectorAll('label[for]').forEach((label) => {
		label.htmlFor = label.htmlFor.replace(/-\d+-/, '-' + serial + '-');
	});
	clone.querySelectorAll('[data-remove-ingredient]').forEach((button) => button.remove());
	clone.querySelectorAll('details[data-reset-closed]').forEach((details) => {
		if (details instanceof HTMLDetailsElement) details.open = false;
	});
	addRemoveButton(clone);
	updateUnits(clone);
	return clone;
}

function parseIngredient(card, index, errors, warnings) {
	if (index > 0 && cardIsEmpty(card)) return null;
	const nameField = getInput(card, 'name');
	const name = raw(card, 'name');
	if (!name && nameField instanceof HTMLInputElement) errors.push({ targetId: nameField.id, message: 'Gib einen Namen für die Zutat ein.' });
	const basisField = getInput(card, 'basis');
	const basis = raw(card, 'basis');
	if (basis !== 'g' && basis !== 'ml' && basisField instanceof HTMLSelectElement) {
		errors.push({ targetId: basisField.id, message: 'Wähle pro 100 g oder pro 100 ml.' });
	}
	const macroMax = basis === 'ml' ? 200 : 100;
	const amount = numberValue(card, 'amount', Number.MIN_VALUE, 10000, errors, 'Verwendete Menge');
	const caloriesPer100 = numberValue(card, 'caloriesPer100', 0, 2000, errors, 'Energie');
	const proteinPer100 = numberValue(card, 'proteinPer100', 0, macroMax, errors, 'Protein');
	const carbsPer100 = numberValue(card, 'carbsPer100', 0, macroMax, errors, 'Kohlenhydrate');
	const fatPer100 = numberValue(card, 'fatPer100', 0, macroMax, errors, 'Fett');
	if (basis === 'g' && [proteinPer100, carbsPer100, fatPer100].every((value) => value !== null) && proteinPer100 + carbsPer100 + fatPer100 > 100) {
		warnings.push('Bei ' + (name || 'einer Zutat') + ' ergeben Protein, Kohlenhydrate und Fett zusammen mehr als 100 g. Prüfe bitte, ob du die Werte korrekt übernommen hast.');
	}
	const priceRaw = raw(card, 'price');
	const purchasedRaw = raw(card, 'purchasedAmount');
	let priceCents = null;
	let purchasedAmount = null;
	if (priceRaw || purchasedRaw) {
		if (!priceRaw || !purchasedRaw) {
			const field = !priceRaw ? getInput(card, 'price') : getInput(card, 'purchasedAmount');
			errors.push({ targetId: field?.id ?? 'shake-ingredient-1-price', message: 'Preis und gekaufte Gesamtmenge müssen zusammen ausgefüllt werden.' });
		} else {
			priceCents = euroValue(card, 'price', errors, 'Der Preis');
			purchasedAmount = numberValue(card, 'purchasedAmount', Number.MIN_VALUE, 100000, errors, 'Die gekaufte Gesamtmenge');
		}
	}
	if ([amount, caloriesPer100, proteinPer100, carbsPer100, fatPer100].some((value) => value === null) || !name || (basis !== 'g' && basis !== 'ml')) return null;
	return { name, basis, amount, caloriesPer100, proteinPer100, carbsPer100, fatPer100, priceCents, purchasedAmount };
}

function readOptionalFormNumber(form, name, min, max, errors, label) {
	const field = form.querySelector('[name="' + name + '"]');
	if (!(field instanceof HTMLInputElement) || !field.value.trim()) return null;
	const value = parseGermanDecimal(field.value, { min, max, maxDecimals: 2 });
	if (value === null) errors.push({ targetId: field.id, message: label + ' muss zwischen ' + min + ' und ' + max + ' liegen.' });
	return value;
}

function displayNumber(value, suffix = '') {
	return formatNumber(roundForDisplay(value, 1), { maximumFractionDigits: 1 }) + suffix;
}

function displayCents(value) {
	return formatEuro(Math.round(value));
}

function renderIngredients(container, result) {
	appendHeading(container, 'Zutatenaufschlüsselung');
	const list = makeElement('div', { className: 'tool-ingredient-breakdown' });
	result.ingredients.forEach((ingredient) => {
		const card = makeElement('article', { className: 'tool-ingredient-card' });
		card.append(makeElement('h3', { text: ingredient.name }));
		const values = [
			displayNumber(ingredient.amount, ' ' + ingredient.basis),
			displayNumber(ingredient.calories, ' kcal'),
			displayNumber(ingredient.protein, ' g Protein'),
			displayNumber(ingredient.carbs, ' g Kohlenhydrate'),
			displayNumber(ingredient.fat, ' g Fett'),
		];
		if (ingredient.hasPrice) values.push(displayCents(ingredient.costCents));
		card.append(makeElement('p', { text: values.join(' · ') }));
		list.append(card);
	});
	container.append(list);
}

function renderResult(container, result, warnings) {
	clearChildren(container);
	const mainCalories = result.portions === 1 ? result.totals.calories : result.perPortion.calories;
	appendResultHero(container, displayNumber(mainCalories, ' kcal'), result.portions === 1 ? 'Gesamte Mischung' : 'Kalorien pro Portion');
	appendHeading(container, result.recipeName);
	appendResultCards(container, [
		{
			title: result.portions === 1 ? 'Dein Aufbau-Shake' : 'Gesamte Mischung',
			items: [
				{ label: 'Energie', value: displayNumber(result.totals.calories, ' kcal'), emphasis: true },
				{ label: 'Protein', value: displayNumber(result.totals.protein, ' g') },
				{ label: 'Kohlenhydrate', value: displayNumber(result.totals.carbs, ' g') },
				{ label: 'Fett', value: displayNumber(result.totals.fat, ' g') },
			],
		},
		...(result.portions > 1 ? [{
			title: 'Pro Portion',
			items: [
				{ label: 'Energie', value: displayNumber(result.perPortion.calories, ' kcal'), emphasis: true },
				{ label: 'Protein', value: displayNumber(result.perPortion.protein, ' g') },
				{ label: 'Kohlenhydrate', value: displayNumber(result.perPortion.carbs, ' g') },
				{ label: 'Fett', value: displayNumber(result.perPortion.fat, ' g') },
			],
		}] : []),
	]);

	if (result.costState === 'complete') {
		appendResultCards(container, [{
			title: 'Kosten',
			items: [
				{ label: 'Gesamtkosten', value: displayCents(result.totalCostCents) },
				{ label: 'Kosten pro Portion', value: displayCents(result.perPortion.costCents), emphasis: true },
				...(result.weeklyCostCents !== null ? [{ label: 'Wochenkosten', value: displayCents(result.weeklyCostCents) }] : []),
				...(result.monthlyCostCents !== null ? [{ label: 'Monatskosten', value: displayCents(result.monthlyCostCents) }] : []),
				...(result.costPer100CaloriesCents !== null ? [{ label: 'Kosten pro 100 kcal', value: displayCents(result.costPer100CaloriesCents) }] : []),
				...(result.costPer25ProteinCents !== null ? [{ label: 'Kosten pro 25 g Protein', value: displayCents(result.costPer25ProteinCents) }] : []),
			],
		}]);
		if (result.monthlyCostCents !== null) appendParagraph(container, 'Die Monatskosten sind ein rechnerischer Durchschnitt. Monate sind unterschiedlich lang, und Preise oder Mengen können sich ändern.', 'tool-result-note');
	} else if (result.costState === 'partial') {
		const missing = result.ingredients.length - result.ingredients.filter((ingredient) => ingredient.hasPrice).length;
		appendParagraph(container, 'Bisher erfasste Kosten: mindestens ' + displayCents(result.knownCostCents) + '. Für ' + missing + ' von ' + result.ingredients.length + ' Zutaten fehlen Preisangaben. Die tatsächlichen Gesamtkosten sind daher höher oder unbekannt.', 'tool-result-note');
	} else {
		appendParagraph(container, 'Für die Zutaten wurden keine vollständigen Preisangaben eingetragen. Deshalb zeigt der Rechner keine Kostenwerte.', 'tool-result-note');
	}
	if (result.calorieTargetDifference !== null) {
		const difference = result.calorieTargetDifference;
		const text = Math.abs(roundForDisplay(difference, 0)) === 0
			? 'Die Portion entspricht gerundet deinem eingegebenen Kalorienziel.'
			: displayNumber(Math.abs(difference), ' kcal') + (difference < 0 ? ' unter' : ' über') + ' deinem eingegebenen Ziel.';
		appendParagraph(container, text, 'tool-result-note');
	}
	if (result.endVolume !== null) {
		appendParagraph(container, 'Bei einem gemessenen Endvolumen von ' + displayNumber(result.endVolume, ' ml') + ' enthält die Mischung ungefähr ' + displayNumber(result.caloriesPer100Ml, ' kcal pro 100 ml') + (result.portions > 1 ? '. Rechnerisches Volumen pro Portion: ' + displayNumber(result.volumePerPortion, ' ml') + '.' : '.'), 'tool-result-note');
	}
	if (warnings.length > 0) appendList(container, warnings, 'tool-result-warnings');
	renderIngredients(container, result);
}

export function initAufbauShakeUi() {
	const form = document.querySelector('#aufbau-shake-form');
	if (!(form instanceof HTMLFormElement)) return;
	const list = form.querySelector('[data-ingredient-list]');
	if (!(list instanceof HTMLElement)) return;
	let nextSerial = 2;
	enableCalculator(form);
	installDirtyState(form);
	updateIngredientNumbers(list);
	list.querySelectorAll('[data-ingredient-card]').forEach(updateUnits);

	form.addEventListener('change', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const card = target.closest('[data-ingredient-card]');
		if (!(card instanceof HTMLElement)) return;
		if (target instanceof HTMLSelectElement && target.dataset.field === 'basis') updateUnits(card);
		updateIngredientNumbers(list);
	});
	form.addEventListener('input', (event) => {
		if (!(event.target instanceof HTMLElement) || !event.target.closest('[data-ingredient-card]')) return;
		updateIngredientNumbers(list);
	});
	form.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (target.matches('[data-add-ingredient]')) {
			if (list.querySelectorAll('[data-ingredient-card]').length >= 15) return;
			const card = cloneIngredientCard(list, nextSerial++);
			if (!card) return;
			list.append(card);
			updateIngredientNumbers(list);
			card.querySelector('[data-field="name"]')?.focus();
			const addButton = form.querySelector('[data-add-ingredient]');
			if (addButton instanceof HTMLButtonElement && list.querySelectorAll('[data-ingredient-card]').length >= 15) addButton.disabled = true;
		}
		if (target.matches('[data-remove-ingredient]')) {
			const card = target.closest('[data-ingredient-card]');
			if (!(card instanceof HTMLElement)) return;
			const fallback = card.previousElementSibling?.querySelector('[data-field="name"]') ?? form.querySelector('[data-add-ingredient]');
			card.remove();
			clearFormErrors(form);
			hideResultAfterInputChange(form);
			updateIngredientNumbers(list);
			const addButton = form.querySelector('[data-add-ingredient]');
			if (addButton instanceof HTMLButtonElement) addButton.disabled = false;
			if (fallback instanceof HTMLElement) fallback.focus();
		}
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const errors = [];
		const warnings = [];
		const portionsField = form.querySelector('[name="portions"]');
		const portions = portionsField instanceof HTMLInputElement
			? parseGermanDecimal(portionsField.value, { min: 1, max: 20, maxDecimals: 0, integer: true }) : null;
		if (portions === null) errors.push({ targetId: 'shake-portions', message: 'Gib eine ganze Portionszahl zwischen 1 und 20 ein.' });
		const ingredients = [...list.querySelectorAll('[data-ingredient-card]')]
			.map((card, index) => parseIngredient(card, index, errors, warnings))
			.filter(Boolean);
		if (ingredients.length === 0) errors.push({ targetId: 'shake-ingredient-1-name', message: 'Gib mindestens eine vollständige Zutat ein.' });
		const calorieTarget = readOptionalFormNumber(form, 'calorieTarget', 1, 5000, errors, 'Das Kalorienziel');
		const portionsPerWeek = readOptionalFormNumber(form, 'portionsPerWeek', Number.MIN_VALUE, 35, errors, 'Die Portionen pro Woche');
		const endVolume = readOptionalFormNumber(form, 'endVolume', Number.MIN_VALUE, 10000, errors, 'Das Endvolumen');
		if (errors.length > 0 || portions === null || ingredients.length === 0) {
			showErrors(form, errors);
			return;
		}
		const recipeField = form.querySelector('[name="recipeName"]');
		const result = calculateAufbauShake({
			recipeName: recipeField instanceof HTMLInputElement ? recipeField.value : '',
			portions,
			ingredients,
			calorieTarget,
			portionsPerWeek,
			endVolume,
		});
		clearFormErrors(form);
		const container = showResult(form);
		if (container instanceof HTMLElement) renderResult(container, result, warnings);
	});

	form.querySelector('[data-reset]')?.addEventListener('click', () => {
		resetToolForm(form, () => {
			[...list.querySelectorAll('[data-ingredient-card]')].slice(1).forEach((card) => card.remove());
			const first = list.querySelector('[data-ingredient-card]');
			if (first instanceof HTMLElement) updateUnits(first);
			updateIngredientNumbers(list);
			const addButton = form.querySelector('[data-add-ingredient]');
			if (addButton instanceof HTMLButtonElement) addButton.disabled = false;
		});
	});
}
