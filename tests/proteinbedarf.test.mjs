import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProteinbedarf } from '../src/lib/tools/proteinbedarf.mjs';

test('Proteinbereiche folgen den definierten KraftRadar-Orientierungen', () => {
	assert.deepEqual(
		calculateProteinbedarf({ weight: 80, goal: 'alltag' }).minimum,
		64,
	);
	const training = calculateProteinbedarf({ weight: 80, goal: 'training' });
	assert.equal(training.minimum, 96);
	assert.equal(training.maximum, 128);
	const muscle = calculateProteinbedarf({ weight: 80, goal: 'muskelaufbau' });
	assert.equal(muscle.minimum, 128);
	assert.equal(muscle.maximum, 160);
	const deficit = calculateProteinbedarf({ weight: 80, goal: 'defizit' });
	assert.equal(deficit.minimum, 128);
	assert.equal(deficit.maximum, 160);
});

test('fehlendes Protein und Whey werden nur bis zur Untergrenze berechnet', () => {
	const result = calculateProteinbedarf({
		weight: 87.1,
		goal: 'muskelaufbau',
		existingProtein: 120,
		wheyProteinPer100: 75,
		servingSize: 30,
	});
	assert.equal(Math.round(result.minimum), 139);
	assert.equal(Math.round(result.maximum), 174);
	assert.equal(Math.round(result.missingProtein), 19);
	assert.equal(Math.round(result.whey.powderGrams), 26);
	assert.equal(Math.round(result.whey.servings * 10) / 10, 0.9);
});

test('innerhalb und oberhalb des Bereichs entsteht keine negative Fehlmenge', () => {
	assert.equal(calculateProteinbedarf({ weight: 80, goal: 'training', existingProtein: 96 }).state, 'within');
	assert.equal(calculateProteinbedarf({ weight: 80, goal: 'training', existingProtein: 128 }).state, 'within');
	assert.equal(calculateProteinbedarf({ weight: 80, goal: 'training', existingProtein: 110 }).state, 'within');
	const above = calculateProteinbedarf({ weight: 80, goal: 'training', existingProtein: 140 });
	assert.equal(above.state, 'above');
	assert.equal(above.missingProtein, 0);
});

test('fehlende oder unvollständige Whey-Angaben verändern die Proteinlücke nicht', () => {
	const withoutWhey = calculateProteinbedarf({ weight: 80, goal: 'muskelaufbau', existingProtein: 100 });
	assert.equal(withoutWhey.state, 'below');
	assert.equal(withoutWhey.whey, null);
	const wheyWithoutExistingProtein = calculateProteinbedarf({ weight: 80, goal: 'muskelaufbau', wheyProteinPer100: 75, servingSize: 30 });
	assert.equal(wheyWithoutExistingProtein.state, 'target-only');
	assert.equal(wheyWithoutExistingProtein.whey, null);
	const zeroProtein = calculateProteinbedarf({ weight: 80, goal: 'muskelaufbau', existingProtein: 0 });
	assert.equal(zeroProtein.existingProtein, 0);
	assert.equal(zeroProtein.state, 'below');
});

test('ungültige Ziele oder Gewichtswerte ergeben kein Ergebnis', () => {
	assert.equal(calculateProteinbedarf({ weight: 0, goal: 'alltag' }), null);
	assert.equal(calculateProteinbedarf({ weight: -1, goal: 'alltag' }), null);
	assert.equal(calculateProteinbedarf({ weight: 301, goal: 'alltag' }), null);
	assert.equal(calculateProteinbedarf({ weight: 80, goal: 'unbekannt' }), null);
	assert.equal(calculateProteinbedarf({ weight: 80, goal: 'alltag', existingProtein: 0, wheyProteinPer100: 0, servingSize: 30 }).whey, null);
});
