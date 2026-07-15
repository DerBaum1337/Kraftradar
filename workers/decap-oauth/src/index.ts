interface Env {
	GITHUB_OAUTH_CLIENT_ID: string;
	GITHUB_OAUTH_CLIENT_SECRET: string;
	OAUTH_STATE_SECRET: string;
	ALLOWED_ORIGIN: string;
}

const STATE_COOKIE = 'kraftradar_oauth_state';
const COOKIE_MAX_AGE = 600;

function base64url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomValue(bytes = 32): string {
	const buffer = new Uint8Array(bytes);
	crypto.getRandomValues(buffer);
	return base64url(buffer);
}

function decodeBase64url(value: string): Uint8Array {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
	return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function sign(value: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
	return base64url(new Uint8Array(signature));
}

async function createCookie(payload: string, secret: string): Promise<string> {
	return `${payload}.${await sign(payload, secret)}`;
}

async function verifyCookie(value: string | undefined, secret: string): Promise<string | null> {
	if (!value) return null;
	const separator = value.lastIndexOf('.');
	if (separator < 1) return null;
	const payload = value.slice(0, separator);
	const signature = value.slice(separator + 1);
	const expected = await sign(payload, secret);
	if (signature.length !== expected.length) return null;
	let difference = 0;
	for (let index = 0; index < signature.length; index += 1) difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
	return difference === 0 ? payload : null;
}

function cookie(request: Request, name: string): string | undefined {
	return request.headers.get('Cookie')?.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

function html(content: string, status = 200, headers: HeadersInit = {}): Response {
	return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><title>KraftRadar Administration</title><body>${content}</body></html>`, {
		status,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'no-store',
			'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
			...headers,
		},
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		if (request.method !== 'GET') return html('Methode nicht erlaubt.', 405);
		if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET || !env.OAUTH_STATE_SECRET || !env.ALLOWED_ORIGIN) {
			return html('OAuth-Worker ist noch nicht vollständig konfiguriert.', 503);
		}

		if (url.pathname === '/auth') {
			const state = randomValue();
			const verifier = randomValue(64);
			const challengeBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
			const challenge = base64url(new Uint8Array(challengeBytes));
			const payload = base64url(new TextEncoder().encode(JSON.stringify({ state, verifier, origin: env.ALLOWED_ORIGIN, issuedAt: Date.now() })));
			const signedCookie = await createCookie(payload, env.OAUTH_STATE_SECRET);
			const authorize = new URL('https://github.com/login/oauth/authorize');
			authorize.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID);
			authorize.searchParams.set('redirect_uri', `${url.origin}/callback`);
			authorize.searchParams.set('scope', 'repo');
			authorize.searchParams.set('state', state);
			authorize.searchParams.set('code_challenge', challenge);
			authorize.searchParams.set('code_challenge_method', 'S256');
			authorize.searchParams.set('allow_signup', 'false');
			return new Response(null, {
				status: 302,
				headers: {
					Location: authorize.href,
					'Cache-Control': 'no-store',
					'Set-Cookie': `${STATE_COOKIE}=${signedCookie}; Max-Age=${COOKIE_MAX_AGE}; Path=/callback; HttpOnly; Secure; SameSite=Lax`,
				},
			});
		}

		if (url.pathname === '/callback') {
			const payload = await verifyCookie(cookie(request, STATE_COOKIE), env.OAUTH_STATE_SECRET);
			const clearCookie = `${STATE_COOKIE}=; Max-Age=0; Path=/callback; HttpOnly; Secure; SameSite=Lax`;
			if (!payload) return html('Ungültiger oder abgelaufener OAuth-Status.', 400, { 'Set-Cookie': clearCookie });
			let session: { state: string; verifier: string; origin: string; issuedAt: number };
			try {
				session = JSON.parse(new TextDecoder().decode(decodeBase64url(payload)));
			} catch {
				return html('Ungültiger OAuth-Status.', 400, { 'Set-Cookie': clearCookie });
			}
			if (Date.now() - session.issuedAt > COOKIE_MAX_AGE * 1000 || url.searchParams.get('state') !== session.state || session.origin !== env.ALLOWED_ORIGIN) {
				return html('OAuth-Status konnte nicht bestätigt werden.', 400, { 'Set-Cookie': clearCookie });
			}
			if (url.searchParams.get('error')) return html('GitHub-Anmeldung wurde abgebrochen.', 400, { 'Set-Cookie': clearCookie });
			const code = url.searchParams.get('code');
			if (!code) return html('GitHub hat keinen Autorisierungscode zurückgegeben.', 400, { 'Set-Cookie': clearCookie });

			const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ client_id: env.GITHUB_OAUTH_CLIENT_ID, client_secret: env.GITHUB_OAUTH_CLIENT_SECRET, code, redirect_uri: `${url.origin}/callback`, code_verifier: session.verifier }),
			});
			const token = await tokenResponse.json() as { access_token?: string };
			if (!tokenResponse.ok || !token.access_token) return html('GitHub-Token konnte nicht abgerufen werden.', 502, { 'Set-Cookie': clearCookie });
			const payloadForDecap = JSON.stringify({ token: token.access_token, provider: 'github' });
			const script = `window.opener&&window.opener.postMessage(${JSON.stringify(`authorization:github:success:${payloadForDecap}`)},${JSON.stringify(env.ALLOWED_ORIGIN)});window.close();`;
			return html(`<p>Anmeldung erfolgreich. Dieses Fenster schließt sich.</p><script>${script}</script>`, 200, { 'Set-Cookie': clearCookie });
		}

		return html('Nicht gefunden.', 404);
	},
};
