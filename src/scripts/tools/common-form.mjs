import { parseGermanDecimal, formatNumber } from '../../lib/tools/numbers.mjs';
import { parseEuroToCents } from '../../lib/tools/money.mjs';

export function makeElement(tagName, options = {}) {
	const element = document.createElement(tagName);
	if (options.className) element.className = options.className;
	if (options.text !== undefined) element.textContent = options.text;
	if (options.attributes) {
		Object.entries(options.attributes).forEach(([name, value]) => {
			element.setAttribute(name, String(value));
		});
	}
	return element;
}

export function clearChildren(element) {
	while (element.firstChild) element.removeChild(element.firstChild);
}

export function enableCalculator(form) {
	const button = form.querySelector('[data-calculate]');
	if (button instanceof HTMLButtonElement) button.disabled = false;
}

export function clearFormErrors(form) {
	form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
		field.removeAttribute('aria-invalid');
		field.classList.remove('tool-field-error');
	});
	form.querySelectorAll('.tool-field-error').forEach((element) => element.classList.remove('tool-field-error'));
	form.querySelectorAll('[data-error-for]').forEach((element) => {
		element.textContent = '';
		element.hidden = true;
	});
	const summary = form.querySelector('[data-error-summary]');
	if (summary instanceof HTMLElement) {
		const list = summary.querySelector('[data-error-list]');
		if (list instanceof HTMLElement) clearChildren(list);
		summary.hidden = true;
	}
}

function findErrorTarget(form, targetId) {
	return [...form.querySelectorAll('[id]')].find((element) => element.id === targetId) ?? null;
}

function getErrorElement(form, targetId, field) {
	const existing = form.querySelector('[data-error-for="' + targetId + '"]');
	if (existing instanceof HTMLElement) return existing;
	const error = makeElement('p', {
		className: 'tool-inline-error',
		attributes: { 'data-error-for': targetId, id: targetId + '-error' },
	});
	const container = field.closest('.tool-field') ?? field.parentElement;
	container?.append(error);
	if (field.matches('input, select, textarea')) {
		const describedBy = field.getAttribute('aria-describedby');
		field.setAttribute('aria-describedby', [describedBy, error.id].filter(Boolean).join(' '));
	}
	return error;
}

export function showErrors(form, errors) {
	clearFormErrors(form);
	const summary = form.querySelector('[data-error-summary]');
	const list = form.querySelector('[data-error-list]');
	if (!(summary instanceof HTMLElement) || !(list instanceof HTMLElement)) return;
	clearChildren(list);

	errors.forEach((error) => {
		const item = makeElement('li');
		const link = makeElement('a', {
			text: error.message,
			attributes: { href: '#' + error.targetId },
		});
		link.addEventListener('click', () => {
			const target = findErrorTarget(form, error.targetId);
			if (target instanceof HTMLElement) target.focus();
		});
		item.append(link);
		list.append(item);
		const target = findErrorTarget(form, error.targetId);
		if (!(target instanceof HTMLElement)) return;
		target.setAttribute('aria-invalid', 'true');
		const errorElement = getErrorElement(form, error.targetId, target);
		errorElement.textContent = error.message;
		errorElement.hidden = false;
	});

	summary.hidden = false;
	const heading = summary.querySelector('h2');
	if (heading instanceof HTMLElement) heading.focus();
}

export function hideResultAfterInputChange(form) {
	const result = form.parentElement?.querySelector('[data-result]');
	const note = form.querySelector('[data-recalculate-note]');
	if (result instanceof HTMLElement && !result.hidden) {
		result.hidden = true;
		if (note instanceof HTMLElement) note.hidden = false;
	}
}

export function installDirtyState(form) {
	const markDirty = () => hideResultAfterInputChange(form);
	form.addEventListener('input', markDirty);
	form.addEventListener('change', markDirty);
}

export function showResult(form) {
	const result = form.parentElement?.querySelector('[data-result]');
	const note = form.querySelector('[data-recalculate-note]');
	if (!(result instanceof HTMLElement)) return null;
	result.hidden = false;
	if (note instanceof HTMLElement) note.hidden = true;
	const heading = result.querySelector('h2');
	if (heading instanceof HTMLElement) heading.focus();
	return result.querySelector('[data-result-content]');
}

export function resetToolForm(form, cleanup = () => {}) {
	form.reset();
	cleanup();
	clearFormErrors(form);
	const result = form.parentElement?.querySelector('[data-result]');
	const note = form.querySelector('[data-recalculate-note]');
	if (result instanceof HTMLElement) result.hidden = true;
	if (note instanceof HTMLElement) note.hidden = true;
	const firstInput = form.querySelector('input, select, textarea');
	if (firstInput instanceof HTMLElement) firstInput.focus();
}

export function readDecimal(form, fieldName, errors, options = {}) {
	const field = form.querySelector('[name="' + fieldName + '"]');
	const required = options.required !== false;
	if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return null;
	const raw = field.value.trim();
	if (!raw) {
		if (required) errors.push({ targetId: field.id, message: options.emptyMessage ?? 'Bitte fülle dieses Feld aus.' });
		return null;
	}
	const value = parseGermanDecimal(raw, options);
	if (value === null) errors.push({ targetId: field.id, message: options.invalidMessage ?? 'Bitte gib einen gültigen Wert im erlaubten Bereich ein.' });
	return value;
}

export function readOptionalDecimal(form, fieldName, errors, options = {}) {
	return readDecimal(form, fieldName, errors, { ...options, required: false });
}

export function readEuro(form, fieldName, errors, options = {}) {
	const field = form.querySelector('[name="' + fieldName + '"]');
	const required = options.required !== false;
	if (!(field instanceof HTMLInputElement)) return null;
	const raw = field.value.trim();
	if (!raw) {
		if (required) errors.push({ targetId: field.id, message: options.emptyMessage ?? 'Bitte gib einen Preis ein.' });
		return null;
	}
	const cents = parseEuroToCents(raw);
	const maxCents = (options.max ?? 5000) * 100;
	if (cents === null || cents > maxCents) {
		errors.push({ targetId: field.id, message: options.invalidMessage ?? 'Bitte gib einen gültigen Preis im erlaubten Bereich ein.' });
		return null;
	}
	return cents;
}

export function formatDecimal(value, decimals = 1) {
	return formatNumber(value, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

export function appendResultCards(container, cards) {
	const grid = makeElement('div', { className: 'tool-result-grid' });
	cards.forEach((card) => {
		const article = makeElement('article', { className: 'tool-result-card' });
		article.append(makeElement('h3', { text: card.title }));
		card.items.forEach((item) => {
			const line = makeElement('p', { className: item.emphasis ? 'tool-result-emphasis' : undefined });
			line.append(makeElement('strong', { text: item.label + ': ' }));
			line.append(document.createTextNode(item.value));
			article.append(line);
		});
		grid.append(article);
	});
	container.append(grid);
}

export function appendParagraph(container, text, className = '') {
	container.append(makeElement('p', { className, text }));
}

export function appendHeading(container, text, level = 3) {
	container.append(makeElement('h' + level, { text }));
}

export function appendList(container, items, className = '') {
	const list = makeElement('ul', { className });
	items.forEach((item) => list.append(makeElement('li', { text: item })));
	container.append(list);
}
