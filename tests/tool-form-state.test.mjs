import test from 'node:test';
import assert from 'node:assert/strict';
import { getDiscountFieldState, getRequiredPairState } from '../src/lib/tools/form-state.mjs';

class FakeElement {
	constructor() {
		this.hidden = false;
		this.textContent = 'Fehler';
		this.attributes = new Map();
		this.children = [];
		this.classList = {
			removed: [],
			remove: (className) => this.classList.removed.push(className),
		};
		this.matchesBySelector = new Map();
		this.singleBySelector = new Map();
	}

	setAttribute(name, value) {
		this.attributes.set(name, value);
	}

	hasAttribute(name) {
		return this.attributes.has(name);
	}

	removeAttribute(name) {
		this.attributes.delete(name);
	}

	querySelectorAll(selector) {
		return this.matchesBySelector.get(selector) ?? [];
	}

	querySelector(selector) {
		return this.singleBySelector.get(selector) ?? null;
	}

	get firstChild() {
		return this.children[0] ?? null;
	}

	removeChild(child) {
		this.children = this.children.filter((item) => item !== child);
		return child;
	}
}

test('Rabattfeldstatus ist nur bei aktivem Rabatt erforderlich', () => {
	assert.deepEqual(getDiscountFieldState('none'), { required: false, disabled: true });
	assert.deepEqual(getDiscountFieldState('percent'), { required: true, disabled: false });
	assert.deepEqual(getDiscountFieldState('fixed'), { required: true, disabled: false });
});

test('Wertepaare werden erst bei mindestens einer Eingabe zu Pflichtpaaren', () => {
	assert.deepEqual(getRequiredPairState('', ''), { firstRequired: false, secondRequired: false });
	assert.deepEqual(getRequiredPairState('87,1', ''), { firstRequired: true, secondRequired: true });
	assert.deepEqual(getRequiredPairState('', '87,1'), { firstRequired: true, secondRequired: true });
	assert.deepEqual(getRequiredPairState('87,1', '88'), { firstRequired: true, secondRequired: true });
	assert.deepEqual(getRequiredPairState('  ', '\t'), { firstRequired: false, secondRequired: false });
});

test('clearFormErrors leert und verbirgt den Fehlerzustand innerhalb des Formulars', async () => {
	globalThis.HTMLElement = FakeElement;
	const { clearFormErrors } = await import('../src/scripts/tools/common-form.mjs');
	const field = new FakeElement();
	field.setAttribute('aria-invalid', 'true');
	const inlineError = new FakeElement();
	const wrapper = new FakeElement();
	const list = new FakeElement();
	list.children = [new FakeElement(), new FakeElement()];
	const summary = new FakeElement();
	summary.singleBySelector.set('[data-error-list]', list);
	const form = new FakeElement();
	form.matchesBySelector.set('[aria-invalid="true"]', [field]);
	form.matchesBySelector.set('.tool-field-error', [wrapper]);
	form.matchesBySelector.set('[data-error-for]', [inlineError]);
	form.singleBySelector.set('[data-error-summary]', summary);

	clearFormErrors(form);

	assert.equal(field.hasAttribute('aria-invalid'), false);
	assert.deepEqual(field.classList.removed, ['tool-field-error']);
	assert.deepEqual(wrapper.classList.removed, ['tool-field-error']);
	assert.equal(inlineError.textContent, '');
	assert.equal(inlineError.hidden, true);
	assert.equal(list.children.length, 0);
	assert.equal(summary.hidden, true);
});
