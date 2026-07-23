import test from 'node:test';
import assert from 'node:assert/strict';
import { getDiscountFieldState, getRequiredPairState } from '../src/lib/tools/form-state.mjs';

class FakeElement {
	constructor() {
		this.hidden = false;
		this.textContent = 'Fehler';
		this.attributes = new Map();
		this.children = [];
		this.listeners = new Map();
		this.parentElement = null;
		this.detailsAncestor = null;
		this.focused = false;
		this.resetCalled = false;
		this.id = '';
		this.className = '';
		this.classList = {
			removed: [],
			remove: (className) => this.classList.removed.push(className),
		};
		this.matchesBySelector = new Map();
		this.singleBySelector = new Map();
	}

	setAttribute(name, value) {
		this.attributes.set(name, String(value));
		if (name === 'id') this.id = String(value);
	}

	getAttribute(name) {
		return this.attributes.get(name) ?? null;
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

	append(...children) {
		children.forEach((child) => {
			this.children.push(child);
			if (child instanceof FakeElement) child.parentElement = this;
		});
	}

	addEventListener(type, listener) {
		const listeners = this.listeners.get(type) ?? [];
		listeners.push(listener);
		this.listeners.set(type, listeners);
	}

	dispatch(type, event = {}) {
		for (const listener of this.listeners.get(type) ?? []) listener(event);
	}

	closest(selector) {
		return selector === 'details' ? this.detailsAncestor : null;
	}

	matches() {
		return false;
	}

	focus() {
		this.focused = true;
	}

	reset() {
		this.resetCalled = true;
	}

	get firstChild() {
		return this.children[0] ?? null;
	}

	removeChild(child) {
		this.children = this.children.filter((item) => item !== child);
		return child;
	}
}

class FakeDetailsElement extends FakeElement {
	constructor(open = false) {
		super();
		this.open = open;
	}
}

function installFakeDom() {
	globalThis.HTMLElement = FakeElement;
	globalThis.HTMLDetailsElement = FakeDetailsElement;
	globalThis.HTMLInputElement = class extends FakeElement {};
	globalThis.HTMLSelectElement = class extends FakeElement {};
	globalThis.HTMLTextAreaElement = class extends FakeElement {};
	globalThis.HTMLButtonElement = class extends FakeElement {};
	globalThis.document = {
		createElement: () => new FakeElement(),
		createTextNode: (text) => ({ textContent: text }),
	};
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


test('showErrors öffnet verschachtelte Disclosure-Bereiche und Fehlerlinks öffnen sie erneut', async () => {
	installFakeDom();
	const { showErrors } = await import('../src/scripts/tools/common-form.mjs');

	const outer = new FakeDetailsElement(false);
	const inner = new FakeDetailsElement(false);
	const wrapper = new FakeElement();
	inner.parentElement = wrapper;
	wrapper.detailsAncestor = outer;

	const target = new FakeElement();
	target.id = 'price-field';
	target.detailsAncestor = inner;

	const inlineError = new FakeElement();
	const list = new FakeElement();
	const heading = new FakeElement();
	const summary = new FakeElement();
	summary.singleBySelector.set('[data-error-list]', list);
	summary.singleBySelector.set('h2', heading);

	const form = new FakeElement();
	form.matchesBySelector.set('[aria-invalid="true"]', []);
	form.matchesBySelector.set('.tool-field-error', []);
	form.matchesBySelector.set('[data-error-for]', [inlineError]);
	form.matchesBySelector.set('[id]', [target]);
	form.singleBySelector.set('[data-error-summary]', summary);
	form.singleBySelector.set('[data-error-list]', list);
	form.singleBySelector.set('[data-error-for="price-field"]', inlineError);

	showErrors(form, [{ targetId: 'price-field', message: 'Preis fehlt.' }]);

	assert.equal(outer.open, true);
	assert.equal(inner.open, true);
	assert.equal(heading.focused, true);
	assert.equal(target.getAttribute('aria-invalid'), 'true');
	assert.equal(inlineError.hidden, false);
	assert.equal(inlineError.textContent, 'Preis fehlt.');

	outer.open = false;
	inner.open = false;
	target.focused = false;
	const link = list.children[0].children[0];
	let prevented = false;
	link.dispatch('click', { preventDefault: () => { prevented = true; } });

	assert.equal(prevented, true);
	assert.equal(outer.open, true);
	assert.equal(inner.open, true);
	assert.equal(target.focused, true);
});

test('resetToolForm schließt nur markierte optionale Bereiche', async () => {
	installFakeDom();
	const { resetToolForm } = await import('../src/scripts/tools/common-form.mjs');

	const resetClosed = new FakeDetailsElement(true);
	const persistent = new FakeDetailsElement(true);
	const firstInput = new FakeElement();
	const result = new FakeElement();
	result.hidden = false;
	const note = new FakeElement();
	note.hidden = false;
	const parent = new FakeElement();
	parent.singleBySelector.set('[data-result]', result);

	const form = new FakeElement();
	form.parentElement = parent;
	form.matchesBySelector.set('details[data-reset-closed]', [resetClosed]);
	form.matchesBySelector.set('[aria-invalid="true"]', []);
	form.matchesBySelector.set('.tool-field-error', []);
	form.matchesBySelector.set('[data-error-for]', []);
	form.singleBySelector.set('[data-error-summary]', null);
	form.singleBySelector.set('[data-recalculate-note]', note);
	form.singleBySelector.set('input, select, textarea', firstInput);

	resetToolForm(form);

	assert.equal(form.resetCalled, true);
	assert.equal(resetClosed.open, false);
	assert.equal(persistent.open, true);
	assert.equal(result.hidden, true);
	assert.equal(note.hidden, true);
	assert.equal(firstInput.focused, true);
});
