import process from 'node:process';

const productionHost = 'kraftradar.de';
const sitemapUrl = `https://${productionHost}/sitemap.xml`;
const endpoint = 'https://api.indexnow.org/indexnow';
const key = '4532f0b5102d5ee982d7a23938e680f7279272fc5f51bc1aff57d00e089185b1';
const keyLocation = `https://${productionHost}/${key}.txt`;

function printUsage() {
	console.log(`IndexNow wird nur bewusst manuell nach einem erfolgreichen Produktions-Deployment ausgeführt.

Beispiele:
  npm run indexnow -- https://${productionHost}/training/
  npm run indexnow -- --sitemap`);
}

function decodeXml(value) {
	return value
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'");
}

function normaliseProductionUrl(value) {
	try {
		const url = new URL(value);
		const path = url.pathname.toLowerCase();
		if (
			url.protocol !== 'https:'
			|| url.hostname !== productionHost
			|| url.port
			|| url.username
			|| url.password
			|| url.search
			|| url.hash
			|| path === '/admin'
			|| path.startsWith('/admin/')
			|| /(^|\/)(draft|preview)(\/|$)/.test(path)
		) {
			return null;
		}

		return url.href;
	} catch {
		return null;
	}
}

function hasNoindex(response, html) {
	const header = response.headers.get('x-robots-tag') ?? '';
	if (/\bnoindex\b/i.test(header)) return true;

	return /<meta\b(?=[^>]*\bname\s*=\s*["']?robots["']?)(?=[^>]*\bcontent\s*=\s*["'][^"']*\bnoindex\b[^"']*["'])[^>]*>/i.test(html);
}

async function getSitemapUrls() {
	const response = await fetch(sitemapUrl, { headers: { accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' } });
	if (!response.ok) {
		throw new Error(`Die Live-Sitemap ist nicht erreichbar (${response.status} ${response.statusText}).`);
	}

	const xml = await response.text();
	const urls = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
	if (urls.length === 0) {
		throw new Error('Die Live-Sitemap enthält keine <loc>-Einträge.');
	}

	return urls;
}

async function isIndexableLivePage(url) {
	const response = await fetch(url, { headers: { accept: 'text/html,application/xhtml+xml' } });
	if (!response.ok) {
		throw new Error(`${url} ist nicht öffentlich erreichbar (${response.status} ${response.statusText}).`);
	}

	const html = await response.text();
	return !hasNoindex(response, html);
}

function reportIndexNowError(response) {
	const messages = {
		400: 'Ungültige IndexNow-Anfrage. Prüfe URL-Format und Schlüsseldatei.',
		403: 'Der IndexNow-Schlüssel wurde nicht akzeptiert oder die Schlüsseldatei ist noch nicht öffentlich erreichbar.',
		422: 'Mindestens eine URL gehört nicht zur angegebenen Domain.',
		429: 'IndexNow hat die Anfrage vorübergehend begrenzt. Bitte später erneut versuchen.',
	};
	return messages[response.status] ?? `IndexNow hat die Anfrage abgelehnt (${response.status} ${response.statusText}).`;
}

async function main() {
	const args = process.argv.slice(2);
	if (args.includes('--help') || args.includes('-h')) {
		printUsage();
		return;
	}
	if (args.length === 0) {
		console.log('Keine URLs angegeben. Es wurde keine IndexNow-Anfrage gesendet.');
		printUsage();
		return;
	}

	const wantsSitemap = args.includes('--sitemap');
	const suppliedUrls = args.filter((arg) => arg !== '--sitemap');
	const candidates = [...suppliedUrls, ...(wantsSitemap ? await getSitemapUrls() : [])];
	const urls = [...new Set(candidates.map(normaliseProductionUrl).filter(Boolean))];

	if (urls.length === 0) {
		throw new Error('Keine zulässige Produktions-URL übrig. Nur https://kraftradar.de ohne Query oder Hash ist erlaubt.');
	}

	const indexableUrls = [];
	for (const url of urls) {
		if (await isIndexableLivePage(url)) {
			indexableUrls.push(url);
		} else {
			console.warn(`Übersprungen (noindex): ${url}`);
		}
	}

	if (indexableUrls.length === 0) {
		throw new Error('Keine indexierbare Produktions-URL übrig. Es wurde keine IndexNow-Anfrage gesendet.');
	}

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ host: productionHost, key, keyLocation, urlList: indexableUrls }),
	});

	if (response.status === 200 || response.status === 202) {
		console.log(`IndexNow hat ${indexableUrls.length} URL(s) angenommen (${response.status}).`);
		return;
	}

	throw new Error(reportIndexNowError(response));
}

main().catch((error) => {
	console.error(`IndexNow: ${error.message}`);
	process.exitCode = 1;
});
