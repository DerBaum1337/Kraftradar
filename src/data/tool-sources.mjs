const accessedAt = '2026-07-22';

export const toolSources = Object.freeze({
	dgeProtein: {
		title: 'Referenzwert Protein',
		publisher: 'Deutsche Gesellschaft für Ernährung',
		url: 'https://www.dge.de/wissenschaft/referenzwerte/protein/',
		accessedAt,
	},
	dgeProteinFaq: {
		title: 'Fragen und Antworten zu Protein und unentbehrlichen Aminosäuren',
		publisher: 'Deutsche Gesellschaft für Ernährung',
		url: 'https://www.dge.de/gesunde-ernaehrung/faq/ausgewaehlte-fragen-und-antworten-zu-protein-und-unentbehrlichen-aminosaeuren/',
		accessedAt,
	},
	dgeProteinSport: {
		title: 'Proteinzufuhr im Sport',
		publisher: 'Deutsche Gesellschaft für Ernährung',
		url: 'https://www.dge.de/wissenschaft/stellungnahmen-und-positionspapiere/positionen/proteinzufuhr-im-sport/',
		accessedAt,
	},
	dgeEnergySport: {
		title: 'Energiebedarf im Sport',
		publisher: 'Deutsche Gesellschaft für Ernährung',
		url: 'https://www.dge.de/wissenschaft/stellungnahmen-und-positionspapiere/positionen/energiebedarf-im-sport/',
		accessedAt,
	},
	issnProtein: {
		title: 'International Society of Sports Nutrition position stand: protein and exercise',
		publisher: 'Journal of the International Society of Sports Nutrition',
		url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/',
		accessedAt,
	},
	mortonProtein: {
		title: 'Protein supplementation and resistance training: systematic review and meta-analysis',
		publisher: 'British Journal of Sports Medicine',
		url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/',
		accessedAt,
	},
	euNutrition: {
		title: 'Verordnung (EU) Nr. 1169/2011 über Lebensmittelinformationen',
		publisher: 'EUR-Lex',
		url: 'https://eur-lex.europa.eu/eli/reg/2011/1169/oj/',
		accessedAt,
	},
	egymStrength: {
		title: 'Wie du deine Maximalkraft mit EGYM testest',
		publisher: 'EGYM',
		url: 'https://de.egym.com/de-de/strength-test',
		accessedAt,
	},
	egymMethods: {
		title: 'Welche EGYM Trainingsmethoden gibt es?',
		publisher: 'EGYM Help Center',
		url: 'https://help.egym.com/de/articles/9817092-welche-egym-trainingsmethoden-gibt-es',
		accessedAt,
	},
	egymAdaptive: {
		title: 'EGYM Trainingsmethoden – Adaptiv',
		publisher: 'EGYM Help Center',
		url: 'https://help.egym.com/de/articles/9817104-egym-trainingsmethoden-adaptiv',
		accessedAt,
	},
	egymIsokinetic: {
		title: 'EGYM Trainingsmethoden – Isokinetisch',
		publisher: 'EGYM Help Center',
		url: 'https://help.egym.com/de/articles/9817102-egym-trainingsmethoden-isokinetisch',
		accessedAt,
	},
	egymNegative: {
		title: 'EGYM Trainingsmethoden – Negativ',
		publisher: 'EGYM Help Center',
		url: 'https://help.egym.com/de/articles/9817106-egym-trainingsmethoden-negativ',
		accessedAt,
	},
	egymBioAge: {
		title: 'Das neue EGYM BioAge: Juli 2026 Update',
		publisher: 'EGYM',
		url: 'https://de.egym.com/de-de/bioage-update-2026',
		accessedAt,
	},
	oneRmReliability: {
		title: 'Test–retest reliability of one-repetition maximum strength assessment: systematic review',
		publisher: 'Sports Medicine',
		url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7367986/',
		accessedAt,
	},
	oneRmFamiliarisation: {
		title: 'Familiarization to resistance training testing procedures',
		publisher: 'Journal of Strength and Conditioning Research',
		url: 'https://pubmed.ncbi.nlm.nih.gov/22990569/',
		accessedAt,
	},
	cdcAnthropometry: {
		title: 'NHANES Anthropometry Procedures Manual 2021',
		publisher: 'Centers for Disease Control and Prevention',
		url: 'https://stacks.cdc.gov/view/cdc/127207',
		accessedAt,
	},
	whoWaist: {
		title: 'Waist Circumference and Waist-Hip Ratio',
		publisher: 'World Health Organization',
		url: 'https://www.who.int/publications/i/item/9789241501491',
		accessedAt,
	},
	selfMeasurements: {
		title: 'Self-measurement of waist, hip and neck circumference',
		publisher: 'BMC Public Health',
		url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4855335/',
		accessedAt,
	},
	waistUncertainty: {
		title: 'Measurement error in waist circumference',
		publisher: 'BMC Public Health',
		url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10271771/',
		accessedAt,
	},
	weightFluctuation: {
		title: 'Daily body mass fluctuation in active men',
		publisher: 'International Journal of Sport Nutrition and Exercise Metabolism',
		url: 'https://pubmed.ncbi.nlm.nih.gov/15673099/',
		accessedAt,
	},
	waiForms: {
		title: 'Forms Tutorial',
		publisher: 'W3C Web Accessibility Initiative',
		url: 'https://www.w3.org/WAI/tutorials/forms/',
		accessedAt,
	},
});

export function getToolSources(ids) {
	return ids.map((id) => toolSources[id]).filter(Boolean);
}
