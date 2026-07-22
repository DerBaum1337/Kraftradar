import { calculateEgymFortschritt } from '../../lib/tools/egym-fortschritt.mjs';
import { differenceInCalendarDays, isFutureDate, parseIsoDate } from '../../lib/tools/dates.mjs';
import { formatNumber, roundForDisplay } from '../../lib/tools/numbers.mjs';
import { getRequiredPairState } from '../../lib/tools/form-state.mjs';
import {
	appendHeading,
	appendParagraph,
	appendResultCards,
	clearFormErrors,
	clearChildren,
	enableCalculator,
	installDirtyState,
	makeElement,
	readDecimal,
	readOptionalDecimal,
	resetToolForm,
	showErrors,
	showResult,
} from './common-form.mjs';

function signed(value, decimals = 1) {
	const prefix = value > 0 ? '+' : '';
	return prefix + formatNumber(roundForDisplay(value, decimals), {
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

export function getEgymSummary(result) {
	if (result.status === 'same') {
		return 'Der eingetragene Krafttestwert ist unverändert.';
	}
	return 'Der eingetragene Krafttestwert der ' + result.exercise + ' ist um '
		+ magnitude(result.differenceKg) + ' kg beziehungsweise '
		+ magnitude(result.differencePercent) + ' % '
		+ (result.status === 'up' ? 'gestiegen.' : 'gesunken.');
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

function appendBars(container, result) {
	const max = Math.max(result.firstValue, result.secondValue);
	const figure = makeElement('div', {
		className: 'tool-comparison-bars',
		attributes: { 'aria-hidden': 'true' },
	});
	[
		['Erster Test', result.firstValue],
		['Zweiter Test', result.secondValue],
	].forEach(([label, value]) => {
		const row = makeElement('div', { className: 'tool-comparison-bar' });
		const line = makeElement('span', { text: label });
		const track = makeElement('span', { className: 'tool-comparison-track' });
		const fill = makeElement('span', { className: 'tool-comparison-fill' });
		fill.style.width = (Number(value) / max) * 100 + '%';
		track.append(fill);
		row.append(line, track);
		figure.append(row);
	});
	container.append(figure);
}

function renderResult(container, result) {
	clearChildren(container);
	const summary = getEgymSummary(result);
	appendParagraph(container, summary, 'tool-result-summary');
	appendResultCards(container, [{
		title: result.exercise + ' · ' + result.side,
		items: [
			{ label: 'Erster Krafttestwert', value: formatNumber(result.firstValue, { maximumFractionDigits: 2 }) + ' kg' },
			{ label: 'Zweiter Krafttestwert', value: formatNumber(result.secondValue, { maximumFractionDigits: 2 }) + ' kg' },
			{ label: 'Veränderung', value: signed(result.differenceKg) + ' kg · ' + signed(result.differencePercent) + ' %', emphasis: true },
			{ label: 'Zeitraum', value: result.days + ' Tage · ' + formatNumber(roundForDisplay(result.weeks, 1), { maximumFractionDigits: 1 }) + ' Wochen' },
		],
	}]);
	appendBars(container, result);
	if (result.perFourWeeks) {
		appendParagraph(container, 'Rechnerisch über vier Wochen: ' + signed(result.perFourWeeks.kg) + ' kg beziehungsweise ' + signed(result.perFourWeeks.percent) + ' %. Dieser Wert verteilt die gesamte Veränderung nur rechnerisch gleichmäßig auf den Zeitraum. Er beweist keinen gleichmäßigen wöchentlichen Verlauf und ist keine Prognose.', 'tool-result-note');
	} else {
		appendParagraph(container, 'Der Zeitraum beträgt weniger als vier Wochen. Deshalb wird keine Veränderung pro vier Wochen angezeigt.', 'tool-result-note');
	}
	if (result.relative) {
		appendHeading(container, 'Relativ zum Körpergewicht');
		appendResultCards(container, [{
			title: 'Krafttest im Verhältnis zum Körpergewicht',
			items: [
				{ label: 'Erster Test', value: formatNumber(roundForDisplay(result.relative.first, 2), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' × Körpergewicht' },
				{ label: 'Zweiter Test', value: formatNumber(roundForDisplay(result.relative.second, 2), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' × Körpergewicht' },
				{ label: 'Relative Veränderung', value: signed(result.relative.differencePercent) + ' %', emphasis: true },
			],
		}]);
		appendParagraph(container, 'Die Relation beschreibt nur die mathematische Kombination der eingegebenen Krafttest- und Körpergewichtswerte.', 'tool-result-note');
	}
	appendParagraph(container, 'Der Rechner beschreibt die Veränderung dieser einen Übung. Er kann nicht bestimmen, welcher Anteil durch Training, Tagesform, Erholung, Testgewöhnung oder andere Einflüsse entstanden ist.', 'tool-result-note');
}

export function initEgymFortschrittUi() {
	const form = document.querySelector('#egym-fortschritt-form');
	if (!(form instanceof HTMLFormElement)) return;
	enableCalculator(form);
	installDirtyState(form);
	const firstBodyweight = form.querySelector('#egym-first-body');
	const secondBodyweight = form.querySelector('#egym-second-body');
	const syncBodyweightRequiredState = () => {
		if (!(firstBodyweight instanceof HTMLInputElement) || !(secondBodyweight instanceof HTMLInputElement)) return;
		const state = getRequiredPairState(firstBodyweight.value, secondBodyweight.value);
		firstBodyweight.required = state.firstRequired;
		secondBodyweight.required = state.secondRequired;
	};
	syncBodyweightRequiredState();
	firstBodyweight?.addEventListener('input', syncBodyweightRequiredState);
	secondBodyweight?.addEventListener('input', syncBodyweightRequiredState);

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const errors = [];
		const exerciseField = form.querySelector('[name="exercise"]');
		const exercise = exerciseField instanceof HTMLInputElement ? exerciseField.value.trim() : '';
		if (!exercise) errors.push({ targetId: exerciseField?.id ?? 'egym-exercise', message: 'Gib die EGYM-Übung ein.' });
		const firstDate = parseDate(form, 'firstDate', errors, 'Das erste Datum');
		const secondDate = parseDate(form, 'secondDate', errors, 'Das zweite Datum');
		if (firstDate && secondDate) {
			const days = differenceInCalendarDays(firstDate, secondDate);
			if (days !== null && days <= 0) errors.push({ targetId: 'egym-second-date', message: 'Das zweite Datum muss nach dem ersten Datum liegen.' });
		}
		const firstValue = readDecimal(form, 'firstValue', errors, {
			min: Number.MIN_VALUE,
			max: 9999.99,
			maxDecimals: 2,
			emptyMessage: 'Gib den ersten Krafttestwert ein.',
			invalidMessage: 'Gib einen Krafttestwert größer als 0 und höchstens 9999,99 kg ein.',
		});
		const secondValue = readDecimal(form, 'secondValue', errors, {
			min: Number.MIN_VALUE,
			max: 9999.99,
			maxDecimals: 2,
			emptyMessage: 'Gib den zweiten Krafttestwert ein.',
			invalidMessage: 'Gib einen Krafttestwert größer als 0 und höchstens 9999,99 kg ein.',
		});
		const firstBodyWeight = readOptionalDecimal(form, 'firstBodyWeight', errors, {
			min: Number.MIN_VALUE,
			max: 1000,
			maxDecimals: 2,
			invalidMessage: 'Gib ein Körpergewicht größer als 0 und höchstens 1000 kg ein.',
		});
		const secondBodyWeight = readOptionalDecimal(form, 'secondBodyWeight', errors, {
			min: Number.MIN_VALUE,
			max: 1000,
			maxDecimals: 2,
			invalidMessage: 'Gib ein Körpergewicht größer als 0 und höchstens 1000 kg ein.',
		});
		if ((firstBodyWeight === null) !== (secondBodyWeight === null)) {
			errors.push({ targetId: firstBodyWeight === null ? 'egym-first-body' : 'egym-second-body', message: 'Für den relativen Vergleich brauchst du beide Körpergewichte oder keines.' });
		}
		const confirmation = form.querySelector('[name="confirmed"]');
		if (!(confirmation instanceof HTMLInputElement) || !confirmation.checked) {
			errors.push({ targetId: 'egym-confirmed', message: 'Bestätige bitte, dass du dieselbe EGYM-Messung vergleichst.' });
		}
		if (errors.length > 0 || !firstDate || !secondDate || firstValue === null || secondValue === null || !exercise) {
			showErrors(form, errors);
			return;
		}
		const sideField = form.querySelector('[name="side"]');
		const side = sideField instanceof HTMLSelectElement ? sideField.value : 'Beidseitig oder nicht getrennt';
		const result = calculateEgymFortschritt({
			exercise,
			side,
			firstDate,
			secondDate,
			firstValue,
			secondValue,
			firstBodyWeight,
			secondBodyWeight,
		});
		if (!result) {
			showErrors(form, [{ targetId: 'egym-second-date', message: 'Die beiden Testwerte konnten nicht verglichen werden.' }]);
			return;
		}
		clearFormErrors(form);
		const container = showResult(form);
		if (container instanceof HTMLElement) renderResult(container, result);
	});

	form.querySelector('[data-reset]')?.addEventListener('click', () => {
		resetToolForm(form);
		syncBodyweightRequiredState();
	});
}
