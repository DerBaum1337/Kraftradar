/**
 * @typedef {'proteinbedarf' | 'whey-preisvergleich' | 'egym-fortschritt' | 'aufbau-shake' | 'koerperfortschritt'} ToolId
 * @typedef {object} Tool
 * @property {ToolId} id
 * @property {string} href
 * @property {string} title
 * @property {string} shortTitle
 * @property {string} description
 * @property {string[]} resultItems
 * @property {string} icon
 * @property {ToolId[]} relatedTools
 */

/** @type {readonly Tool[]} */
export const tools = Object.freeze([
	{
		id: 'proteinbedarf',
		href: '/tools/proteinbedarf-rechner/',
		title: 'Proteinbedarf- und Whey-Rechner',
		shortTitle: 'Proteinbedarf berechnen',
		description: 'Erhalte einen Orientierungsbereich auf Grundlage deines Körpergewichts und deiner gewählten Trainingssituation.',
		resultItems: ['Proteinbereich pro Tag', 'fehlende Proteinmenge', 'entsprechende Whey-Menge'],
		icon: 'protein',
		relatedTools: ['whey-preisvergleich', 'aufbau-shake'],
	},
	{
		id: 'whey-preisvergleich',
		href: '/tools/whey-preisvergleich/',
		title: 'Whey-Preise nachvollziehbar vergleichen',
		shortTitle: 'Whey vergleichen',
		description: 'Vergleiche bis zu vier Produkte anhand von Endpreis, Proteingehalt, Portionen und tatsächlicher Proteinmenge.',
		resultItems: ['Preis pro Kilogramm', 'Preis pro Portion', 'Preis pro 25 g Protein'],
		icon: 'whey',
		relatedTools: ['proteinbedarf', 'aufbau-shake'],
	},
	{
		id: 'egym-fortschritt',
		href: '/tools/egym-fortschrittsrechner/',
		title: 'EGYM-Krafttests vergleichen',
		shortTitle: 'EGYM-Fortschritt auswerten',
		description: 'Vergleiche zwei Krafttestwerte derselben Übung und berechne die absolute und prozentuale Veränderung.',
		resultItems: ['Veränderung in Kilogramm', 'prozentuale Veränderung', 'optional relativ zum Körpergewicht'],
		icon: 'egym',
		relatedTools: ['koerperfortschritt', 'proteinbedarf'],
	},
	{
		id: 'aufbau-shake',
		href: '/tools/aufbau-shake-rechner/',
		title: 'Aufbau-Shake selbst berechnen',
		shortTitle: 'Shake berechnen',
		description: 'Addiere die Nährwerte und Kosten deiner selbst gewählten Zutaten ohne fest eingebaute Produktdaten.',
		resultItems: ['Kalorien und Makros', 'Kosten pro Portion', 'optionale Wochen- und Monatskosten'],
		icon: 'shake',
		relatedTools: ['proteinbedarf', 'whey-preisvergleich'],
	},
	{
		id: 'koerperfortschritt',
		href: '/tools/koerperfortschritt-auswerten/',
		title: 'Gewicht und Körpermaße vergleichen',
		shortTitle: 'Körpermaße vergleichen',
		description: 'Vergleiche zwei Messzeitpunkte neutral, ohne automatisch Muskelaufbau oder Fettverlust zu behaupten.',
		resultItems: ['Veränderung in kg oder cm', 'prozentuale Veränderung', 'Vergleich der Messrichtungen'],
		icon: 'body',
		relatedTools: ['egym-fortschritt', 'proteinbedarf'],
	},
]);

/** @param {string} id @returns {Tool | undefined} */
export function getTool(id) {
	return tools.find((tool) => tool.id === id);
}

/** @param {string} id @returns {Tool[]} */
export function getRelatedTools(id) {
	const tool = getTool(id);
	if (!tool) return [];
	return tool.relatedTools.map((relatedId) => getTool(relatedId)).filter((relatedTool) => relatedTool !== undefined);
}

/** @type {Readonly<Record<string, string[]>>} */
export const toolArticleLinks = Object.freeze({
	proteinbedarf: [
		'hsn-evowhey-vanille-test',
		'hsn-kollagen-hydrolysat-rind-test',
		'hsn-maltodextrin-pulver-test',
	],
	'whey-preisvergleich': [
		'hsn-evowhey-vanille-test',
	],
	'egym-fortschritt': [
		'egym-gewichte-verstehen',
		'egym-app-erklaert',
		'acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte',
	],
	'aufbau-shake': [
		'hsn-evowhey-vanille-test',
		'hsn-maltodextrin-pulver-test',
		'720dgree-ubershaker-test',
	],
	koerperfortschritt: [
		'acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte',
		'fortschritt-dokumentieren',
		'egym-bioage-erklaert',
	],
});

/** @type {Readonly<Record<string, ToolId[]>>} */
export const articleToolLinks = Object.freeze({
	'hsn-evowhey-vanille-test': ['proteinbedarf', 'whey-preisvergleich'],
	'hsn-maltodextrin-pulver-test': ['whey-preisvergleich', 'aufbau-shake'],
	'hsn-kollagen-hydrolysat-rind-test': ['proteinbedarf'],
	'720dgree-ubershaker-test': ['aufbau-shake'],
	'egym-gewichte-verstehen': ['egym-fortschritt'],
	'egym-app-erklaert': ['egym-fortschritt'],
	'egym-bioage-erklaert': ['koerperfortschritt'],
	'fortschritt-dokumentieren': ['koerperfortschritt'],
	'acht-wochen-egym-koerpermasse-gewicht-und-kraftwerte': ['egym-fortschritt', 'koerperfortschritt'],
});
