import { calculateProteinbedarf } from '../../lib/tools/proteinbedarf.mjs';
import { formatNumber, roundForDisplay } from '../../lib/tools/numbers.mjs';
import {
	appendHeading,
	appendParagraph,
	appendResultCards,
	clearFormErrors,
	clearChildren,
	enableCalculator,
	installDirtyState,
	readDecimal,
	readOptionalDecimal,
	resetToolForm,
	showErrors,
	showResult,
} from './common-form.mjs';

function whole(value) {
	return formatNumber(Math.round(value), { maximumFractionDigits: 0 });
}

function oneDecimal(value) {
	return formatNumber(roundForDisplay(value, 1), {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});
}

function goalExplanation(goal) {
	if (goal === 'alltag') return 'Dieser Wert dient der allgemeinen Proteinversorgung. Normale Bewegung führt nicht automatisch zu einem stark erhöhten Proteinbedarf.';
	if (goal === 'training') return 'Der tatsächliche Bedarf kann je nach Trainingsumfang, Sportart, Intensität und Trainingsphase innerhalb des Bereichs schwanken.';
	if (goal === 'muskelaufbau') return 'Protein allein baut keine Muskeln auf. Entscheidend sind regelmäßiges Krafttraining, eine passende Energiezufuhr und langfristige Trainingssteigerung.';
	return 'Eine ausreichende Proteinversorgung und Krafttraining können den Muskelerhalt unterstützen. Der Rechner kann keine Veränderung der Muskelmasse vorhersagen oder garantieren.';
}

function renderResult(container, result, goal) {
	clearChildren(container);
	const isRange = result.goal.min !== result.goal.max;
	const target = isRange
		? whole(result.minimum) + '–' + whole(result.maximum) + ' g Protein pro Tag'
		: whole(result.minimum) + ' g Protein pro Tag';
	appendResultCards(container, [{
		title: 'Deine Orientierung',
		items: [
			{ label: 'Gewählte Situation', value: result.goal.label },
			{ label: 'Proteinbereich', value: target, emphasis: true },
			{ label: 'Verwendete Faktoren', value: result.goal.min.toFixed(1).replace('.', ',') + (isRange ? '–' + result.goal.max.toFixed(1).replace('.', ',') : '') + ' g/kg' },
		],
	}]);

	if (result.state === 'target-only') {
		appendParagraph(container, 'Du kannst optional deine bisherige Proteinmenge ergänzen. Dann zeigt der Rechner, ob dir bis zur Untergrenze des gewählten Bereichs noch Protein fehlt.');
	} else if (result.state === 'below') {
		appendHeading(container, 'Einordnung');
		appendParagraph(container, 'Dir fehlen ungefähr ' + whole(result.missingProtein) + ' g Protein, um das untere Ende des gewählten Bereichs zu erreichen.');
		if (result.whey) {
			appendParagraph(container, 'Das entspricht ungefähr ' + whole(result.whey.powderGrams) + ' g deines Wheys beziehungsweise ' + oneDecimal(result.whey.servings) + ' Portionen à ' + whole(result.servingSize) + ' g.');
			appendParagraph(container, 'Whey ist kein Pflichtprodukt. Es ist lediglich eine praktische Proteinquelle. Die fehlende Menge kann auch über normale Lebensmittel gedeckt werden.', 'tool-result-note');
		} else if (result.wheyProteinPer100 !== null) {
			appendParagraph(container, 'Für eine Whey-Menge fehlt noch eine gültige Portionsgröße.', 'tool-result-note');
		} else {
			appendParagraph(container, 'Du kannst optional Proteingehalt und Portionsgröße deines Wheys ergänzen. Dann zeigt der Rechner eine entsprechende Pulvermenge.', 'tool-result-note');
		}
	} else if (result.state === 'within') {
		appendParagraph(container, 'Deine geschätzte Proteinmenge liegt innerhalb des gewählten Orientierungsbereichs. Zusätzliches Whey ist nicht notwendig, um diesen Bereich zu erreichen.');
	} else if (result.state === 'above') {
		appendParagraph(container, 'Deine geschätzte Proteinmenge liegt über dem gewählten Orientierungsbereich.');
		appendParagraph(container, 'Eine höhere Proteinmenge bedeutet nicht automatisch mehr Muskelaufbau. Der Rechner kann die gesundheitliche Angemessenheit deiner gesamten Ernährung nicht beurteilen.', 'tool-result-note');
	}

	if (result.existingProtein === null && result.wheyProteinPer100 !== null) {
		appendParagraph(container, 'Damit der Rechner eine fehlende Whey-Menge bestimmen kann, benötigt er deine bisherige tägliche Proteinmenge.', 'tool-result-note');
	}
	appendParagraph(container, goalExplanation(goal), 'tool-result-note');
}

export function initProteinbedarfUi() {
	const form = document.querySelector('#proteinbedarf-form');
	if (!(form instanceof HTMLFormElement)) return;
	const wheyField = form.querySelector('[name="wheyProteinPer100"]');
	const servingField = form.querySelector('[name="servingSize"]');
	const syncServingRequirement = () => {
		if (!(wheyField instanceof HTMLInputElement) || !(servingField instanceof HTMLInputElement)) return;
		servingField.required = Boolean(wheyField.value.trim());
	};
	enableCalculator(form);
	installDirtyState(form);
	syncServingRequirement();
	wheyField?.addEventListener('input', syncServingRequirement);

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const errors = [];
		const weight = readDecimal(form, 'weight', errors, {
			min: 30,
			max: 300,
			maxDecimals: 1,
			emptyMessage: 'Gib dein Körpergewicht ein.',
			invalidMessage: 'Gib ein Körpergewicht zwischen 30 und 300 kg ein.',
		});
		const selectedGoal = form.querySelector('input[name="goal"]:checked');
		const goal = selectedGoal instanceof HTMLInputElement ? selectedGoal.value : '';
		if (!goal) errors.push({ targetId: 'protein-goal-group', message: 'Wähle eine Trainingssituation.' });
		const existingProtein = readOptionalDecimal(form, 'existingProtein', errors, {
			min: 0,
			max: 500,
			maxDecimals: 1,
			invalidMessage: 'Gib eine Proteinmenge zwischen 0 und 500 g ein oder lasse das Feld leer.',
		});
		const wheyProteinPer100 = readOptionalDecimal(form, 'wheyProteinPer100', errors, {
			min: 1,
			max: 100,
			maxDecimals: 1,
			invalidMessage: 'Gib einen Proteingehalt zwischen 1 und 100 g pro 100 g ein oder lasse das Feld leer.',
		});
		const servingField = form.querySelector('[name="servingSize"]');
		let servingSize = null;
		if (wheyProteinPer100 !== null) {
			servingSize = readDecimal(form, 'servingSize', errors, {
				min: 1,
				max: 100,
				maxDecimals: 1,
				emptyMessage: 'Gib die Portionsgröße deines Wheys ein.',
				invalidMessage: 'Gib eine Portionsgröße zwischen 1 und 100 g ein.',
			});
		} else if (servingField instanceof HTMLInputElement && !servingField.value.trim()) {
			servingSize = null;
		} else {
			servingSize = readOptionalDecimal(form, 'servingSize', errors, {
				min: 1,
				max: 100,
				maxDecimals: 1,
				invalidMessage: 'Gib eine Portionsgröße zwischen 1 und 100 g ein.',
			});
		}

		if (errors.length > 0 || weight === null || !goal) {
			showErrors(form, errors);
			return;
		}

		const result = calculateProteinbedarf({ weight, goal, existingProtein, wheyProteinPer100, servingSize });
		if (!result) {
			showErrors(form, [{ targetId: 'protein-weight', message: 'Die Eingaben konnten nicht berechnet werden.' }]);
			return;
		}
		clearFormErrors(form);
		const container = showResult(form);
		if (container instanceof HTMLElement) renderResult(container, result, goal);
	});

	const resetButton = form.querySelector('[data-reset]');
	resetButton?.addEventListener('click', () => {
		resetToolForm(form);
		syncServingRequirement();
	});
}
