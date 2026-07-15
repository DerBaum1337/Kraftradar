/* Decap lädt die Konfiguration selbst. Diese Datei hält die lokale Vorschau bewusst minimal. */
window.CMS_MANUAL_INIT = false;
window.CMS?.registerPreviewStyle('/admin/admin.css');

/* Decaps deutsche Standardübersetzung ist hier unnötig umständlich. */
function applyKraftRadarLabels() {
	for (const element of document.querySelectorAll('a, button, [role="button"]')) {
		if (element.textContent?.trim() === 'Neue(r/s) Artikel') {
			element.textContent = 'Neuer Artikel';
			element.setAttribute('aria-label', 'Neuer Artikel');
		}
	}
}

applyKraftRadarLabels();
new MutationObserver(applyKraftRadarLabels).observe(document.body, { childList: true, subtree: true });
