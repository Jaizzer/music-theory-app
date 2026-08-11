// Vite statically replaces `import.meta.env.VITE_*` at build time — only
// vars prefixed VITE_ are exposed to browser code at all (see .env.example),
// so a secret accidentally put in .env without that prefix simply isn't
// reachable here, on purpose.
const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
	throw new Error(
		'Missing VITE_API_URL. Copy .env.example to .env and set it.',
	);
}

const config = { apiUrl };

export default config;
