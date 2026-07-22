import { calculateKoerperfortschritt } from '../../lib/tools/koerperfortschritt.mjs';
import { differenceInCalendarDays, isFutureDate, parseIsoDate } from '../../lib/tools/dates.mjs';
import { formatNumber, parseGermanDecimal, roundForDisplay } from '../../lib/tools/numbers.mjs';
import { getRequiredPairState } from '../../lib/tools/form-state.mjs';
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

function getInput(card, fieldName) {
	return card.querySelector('[data-field="' + fieldName + '"]');
}

function parseDate(form, name, errors, label) {
	const field = form.querySelector('[name="' + name + '"]');
	const value = field instanceof HTMLInputElement ? field.value : '';
	if (!parseIsoDate(value)) {
		errors.push({ targetId: field?.id ?? name, message: label + ' fehlt oder ist ungültig.' });
		return null;
	}
	if (isFutureDate(value)) {
		errors.push({ targetId: field?.id ?? name, message: label + ' darf nicht in der Zukunft liegen.' });
		return null;
	}
	return value;
}

function parseMeasurement(card, errors) {
	const firstField = getInput(card, 'first');
	const secondField = getInput(card, 'second');
	if (!(firstField instanceof HTMLInputElement) || !(secondField instanceof HTMLInputElement)) return null;
	const firstRaw = firstField.value.trim();
	const secondRaw = secondField.value.trim();
	if (!firstRaw && !secondRaw) return null;
	const label = card.dataset.label ?? 'Dieses Maß';
	if (!firstRaw || !secondRaw) {
		errors.push({ targetId: !firstRaw ? firstField.id : secondField.id, message: 'Für ' + label + ' brauchst du beide Messwerte oder keinen.' });
		return null;
	}
	const unit = card.dataset.unit ?? 'cm';
	const max = unit === 'kg' ? 1000 : 500;
	const first = parseGermanDecimal(firstRaw, { min: Number.MIN_VALUE, max, maxDecimals: 2 });
	const second = parseGermanDecimal(secondRaw, { min: Number.MIN_VALUE, max, maxDecimals: 2 });
	if (first === null) errors.push({ targetId: firstField.id, message: 'Die erste Messung für ' + label + ' muss größer als 0 und höchstens ' + max + ' ' + unit + ' sein.' });
	if (second === null) errors.push({ targetId: secondField.id, message: 'Die spätere Messung für ' + label + ' muss größer als 0 und höchstens ' + max + ' ' + unit + ' sein.' });
	if (first === null || second === null) return null;
	return { key: card.dataset.key ?? label, label, unit, first, second };
}

function createCustomMeasurement(serial) {
	const card = makeElement('fieldset', {
		className: 'tool-measurement-card',
		attributes: {
			'data-custom-card': '',
			'data-measurement-card': '',
			'data-key': 'custom-' + serial,
			'data-label': 'Eigenes Maß',
			'data-unit': 'cm',
		},
	});
	const legend = makeElement('legend');
	const number = makeElement('span', {
		text: 'Eigenes Maß ' + serial,
		attributes: { 'data-custom-measurement-number': '' },
	});
	const remove = makeElement('button', {
		className: 'tool-remove-button',
		text: 'Maß entfernen',
		attributes: { type: 'button', 'data-remove-custom-measurement': '' },
	});
	legend.append(number, document.createTextNode(' '), remove);
	card.append(legend);
	const grid = makeElement('div', { className: 'tool-form-grid' });
	const fields = [
		['name', 'Bezeichnung', 'text', ''],
		['first', 'Erste Messung', 'text', 'cm'],
		['second', 'Spätere Messung', 'text', 'cm'],
	];
	fields.forEach(([field, label, type, unit]) => {
		const wrapper = makeElement('div', { className: 'tool-field' });
		const id = 'body-custom-' + serial + '-' + field;
		wrapper.append(makeElement('label', { text: label, attributes: { for: id } }));
		const attributes = {
			id,
			'data-field': field,
			type,
			inputmode: field === 'name' ? 'text' : 'decimal',
			autocomplete: 'off',
		};
		if (field === 'name') attributes.maxlength = 60;
		const input = makeElement('input', {
			attributes,
		});
		if (unit) {
			const withUnit = makeElement('div', { className: 'tool-input-with-unit' });
			withUnit.append(input, makeElement('span', { text: unit }));
			wrapper.append(withUnit);
		} else {
			wrapper.append(input);
		}
		grid.append(wrapper);
	});
	card.append(grid);
	return card;
}

function updateCustomMeasurementNumbers(list) {
	list.querySelectorAll('[data-custom-card]').forEach((card, index) => {
		const number = card.querySelector('[data-custom-measurement-number]');
		if (number) number.textContent = 'Eigenes Maß ' + (index + 1);
		syncMeasurementRequiredState(card);
	});
}

function syncMeasurementRequiredState(card) {
	const first = getInput(card, 'first');
	const second = getInput(card, 'second');
	if (!(first instanceof HTMLInputElement) || !(second instanceof HTMLInputElement)) return;
	const pairState = getRequiredPairState(first.value, second.value);
	first.required = pairState.firstRequired;
	second.required = pairState.secondRequired;
	if (!card.hasAttribute('data-custom-card')) return;
	const name = getInput(card, 'name');
	if (!(name instanceof HTMLInputElement)) return;
	const hasCustomValue = Boolean(name.value.trim()) || pairState.firstRequired;
	name.required = hasCustomValue;
	first.required = hasCustomValue;
	second.required = hasCustomValue;
}

function syncAllMeasurementRequiredStates(form) {
	form.querySelectorAll('[data-measurement-card]').forEach((card) => syncMeasurementRequiredState(card));
}

function signed(value, decimals = 1) {
	return (value > 0 ? '+' : '') + formatNumber(roundForDisplay(value, decimals), {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

function magnitude(value, decimals = 1) {
	return formatNumber(roundForDisplay(Math.abs(value), decimals), {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

function statusText(status) {
	return status === 'larger' ? 'größer' : status === 'smaller' ? 'kleiner' : 'gerundet unverändert';
}

export function getKoerperfortschrittCombinationText(result) {
	if (!result.weight || !result.waist) return null;
	const weightText = result.weight.status === 'same'
		? 'Dein Gewicht ist gerundet unverändert'
		: 'Dein Gewicht ist um ' + magnitude(result.weight.difference) + ' kg ' + (result.weight.status === 'larger' ? 'gestiegen' : 'gesunken');
	const measureName = result.waist.key === 'taille' ? 'dein Taillenumfang' : 'dein Bauchumfang';
	const waistText = result.waist.status === 'same'
		? measureName + ' gerundet unverändert gemessen wurde'
		: measureName + ' um ' + magnitude(result.waist.difference) + ' cm ' + (result.waist.status === 'larger' ? 'größer' : 'kleiner') + ' gemessen wurde';
	return weightText + ', während ' + waistText + '. Die beiden Werte haben sich ' + (result.weight.status === result.waist.status ? 'in dieselbe Richtung' : 'in unterschiedliche Richtungen') + ' bewegt.';
}

function renderResult(container, result) {
	clearChildren(container);
	appendParagraph(container, 'Dein Vergleich über ' + result.days + ' Tage · ' + formatNumber(roundForDisplay(result.weeks, 1), { maximumFractionDigits: 1 }) + ' Wochen', 'tool-result-summary');
	appendParagraph(container, result.counts.larger + ' Werte größer, ' + result.counts.smaller + ' kleiner und ' + result.counts.same + ' gerundet unverändert.', 'tool-result-note');
	result.measurements.forEach((measurement) => {
		appendResultCards(container, [{
			title: measurement.label,
			items: [
				{ label: 'Erste Messung', value: formatNumber(measurement.first, { maximumFractionDigits: 2 }) + ' ' + measurement.unit },
				{ label: 'Spätere Messung', value: formatNumber(measurement.second, { maximumFractionDigits: 2 }) + ' ' + measurement.unit },
				{ label: 'Veränderung', value: signed(measurement.difference) + ' ' + measurement.unit + ' · ' + signed(measurement.differencePercent) + ' %', emphasis: true },
				{ label: 'Einordnung', value: statusText(measurement.status) },
			],
		}]);
	});
	const combination = getKoerperfortschrittCombinationText(result);
	if (combination) {
		appendHeading(container, 'Gewicht und Umfang');
		appendParagraph(container, combination);
		appendParagraph(container, 'Daraus allein lässt sich nicht bestimmen, ob sich Muskelmasse, Körperfett, Körperwasser oder andere Bestandteile verändert haben.', 'tool-result-note');
	}
	appendParagraph(container, 'Kleine Unterschiede können sowohl eine tatsächliche Veränderung als auch normale Messabweichung enthalten. Der Rechner kann beides nicht voneinander trennen.', 'tool-result-note');
}

export function initKoerperfortschrittUi() {
	const form = document.querySelector('#koerperfortschritt-form');
	if (!(form instanceof HTMLFormElement)) return;
	const customList = form.querySelector('[data-custom-measurement-list]');
	if (!(customList instanceof HTMLElement)) return;
	let nextSerial = 1;
	enableCalculator(form);
	installDirtyState(form);
	syncAllMeasurementRequiredStates(form);

	form.addEventListener('input', (event) => {
		if (!(event.target instanceof HTMLElement)) return;
		const card = event.target.closest('[data-measurement-card]');
		if (card instanceof HTMLElement) syncMeasurementRequiredState(card);
	});

	form.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (target.matches('[data-add-custom-measurement]')) {
			if (customList.querySelectorAll('[data-custom-card]').length >= 5) return;
			const card = createCustomMeasurement(nextSerial++);
			customList.append(card);
			updateCustomMeasurementNumbers(customList);
			card.querySelector('[data-field="name"]')?.focus();
			const addButton = form.querySelector('[data-add-custom-measurement]');
			if (addButton instanceof HTMLButtonElement && customList.querySelectorAll('[data-custom-card]').length >= 5) addButton.disabled = true;
		}
		if (target.matches('[data-remove-custom-measurement]')) {
			const card = target.closest('[data-custom-card]');
			if (!(card instanceof HTMLElement)) return;
			const fallback = card.previousElementSibling?.querySelector('[data-field="name"]') ?? form.querySelector('[data-add-custom-measurement]');
			card.remove();
			clearFormErrors(form);
			hideResultAfterInputChange(form);
			updateCustomMeasurementNumbers(customList);
			const addButton = form.querySelector('[data-add-custom-measurement]');
			if (addButton instanceof HTMLButtonElement) addButton.disabled = false;
			if (fallback instanceof HTMLElement) fallback.focus();
		}
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const errors = [];
		const firstDate = parseDate(form, 'firstDate', errors, 'Das erste Datum');
		const secondDate = parseDate(form, 'secondDate', errors, 'Das spätere Datum');
		if (firstDate && secondDate) {
			const days = differenceInCalendarDays(firstDate, secondDate);
			if (days !== null && days <= 0) errors.push({ targetId: 'body-second-date', message: 'Das spätere Datum muss nach dem ersten Datum liegen.' });
		}
		const measurements = [...form.querySelectorAll('[data-measurement-card]')].map((card) => {
			const isCustom = card.hasAttribute('data-custom-card');
			if (isCustom) {
				const nameField = getInput(card, 'name');
				const name = nameField instanceof HTMLInputElement ? nameField.value.trim() : '';
				const firstRaw = getInput(card, 'first')?.value?.trim() ?? '';
				const secondRaw = getInput(card, 'second')?.value?.trim() ?? '';
				if (!name && !firstRaw && !secondRaw) return null;
				if (!name && nameField instanceof HTMLInputElement) errors.push({ targetId: nameField.id, message: 'Gib eine Bezeichnung für dein eigenes Maß ein.' });
				if (name && !firstRaw && !secondRaw && nameField instanceof HTMLInputElement) {
					errors.push({ targetId: nameField.id, message: 'Gib für ' + name + ' beide Messwerte ein oder entferne die Karte.' });
					return null;
				}
				card.dataset.label = name || 'Eigenes Maß';
			}
			return parseMeasurement(card, errors);
		}).filter(Boolean);
		if (measurements.length === 0) errors.push({ targetId: 'body-measurement-group', message: 'Gib mindestens ein vollständiges Wertepaar ein.' });
		const confirmation = form.querySelector('[name="confirmed"]');
		if (!(confirmation instanceof HTMLInputElement) || !confirmation.checked) {
			errors.push({ targetId: 'body-confirmed', message: 'Bestätige bitte die einheitliche Messweise.' });
		}
		if (errors.length > 0 || !firstDate || !secondDate || measurements.length === 0) {
			showErrors(form, errors);
			return;
		}
		const result = calculateKoerperfortschritt({ firstDate, secondDate, measurements });
		if (!result) {
			showErrors(form, [{ targetId: 'body-second-date', message: 'Die Messdaten konnten nicht verglichen werden.' }]);
			return;
		}
		clearFormErrors(form);
		const container = showResult(form);
		if (container instanceof HTMLElement) renderResult(container, result);
	});

	form.querySelector('[data-reset]')?.addEventListener('click', () => {
		resetToolForm(form, () => {
			customList.replaceChildren();
			const addButton = form.querySelector('[data-add-custom-measurement]');
			if (addButton instanceof HTMLButtonElement) addButton.disabled = false;
		});
		syncAllMeasurementRequiredStates(form);
	});
}
