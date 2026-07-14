const ownerName = import.meta.env.LEGAL_OWNER_NAME?.trim();
const streetAndNumber = import.meta.env.LEGAL_STREET_AND_NUMBER?.trim();
const postalCodeAndCity = import.meta.env.LEGAL_POSTAL_CODE_AND_CITY?.trim();
const email = import.meta.env.LEGAL_EMAIL?.trim();

export const legalDetails = {
	complete: Boolean(ownerName && streetAndNumber && postalCodeAndCity && email),
	ownerName: ownerName || '[Vollständigen Namen ergänzen]',
	streetAndNumber: streetAndNumber || '[Straße und Hausnummer ergänzen]',
	postalCodeAndCity: postalCodeAndCity || '[PLZ und Ort ergänzen]',
	email: email || '[Öffentliche Kontakt-E-Mail ergänzen]',
};
