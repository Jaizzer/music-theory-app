import dotenv from 'dotenv';

// Load backend/.env relative to *this file's* location (not the process's
// current working directory), so `npm run dev`/`npm test` behave the same
// no matter which folder they were launched from.
dotenv.config({ path: import.meta.dirname + '/../../.env' });

// Every other check in this file branches on NODE_ENV, so it's validated
// first and given a precise type — once `assertNodeEnv` returns, TypeScript
// knows `nodeEnv` can only ever be one of these three strings, not `string`.
type NodeEnv = 'development' | 'test' | 'production';

function assertNodeEnv(value: string | undefined): NodeEnv {
	if (value === 'development' || value === 'test' || value === 'production') {
		return value;
	}
	throw new Error(
		`Invalid NODE_ENV '${String(value)}'. Expected 'development', 'test', or 'production'.`,
	);
}

const nodeEnv = assertNodeEnv(process.env.NODE_ENV);

// `Number(...)` returns NaN for invalid input rather than throwing, so NaN
// has to be checked explicitly — wrapping it in try/catch would never fire.
const port = Number(process.env.PORT);
if (Number.isNaN(port)) {
	throw new Error(
		`Invalid PORT '${String(process.env.PORT)}'. Expected a number.`,
	);
}

// Each NODE_ENV talks to its own database. This isn't just tidiness: it's
// what guarantees the test suite can never touch development data, and a
// misconfigured local .env can never accidentally point dev at production.
const databaseUrlByEnv: Record<NodeEnv, string | undefined> = {
	development: process.env.DEVELOPMENT_DATABASE_URL,
	test: process.env.TEST_DATABASE_URL,
	production: process.env.PRODUCTION_DATABASE_URL,
};
const databaseUrl = databaseUrlByEnv[nodeEnv];
if (!databaseUrl) {
	throw new Error(
		`Missing database URL for NODE_ENV='${nodeEnv}'. Set ${nodeEnv.toUpperCase()}_DATABASE_URL in .env.`,
	);
}

// Better Auth needs to know its own public origin to build correct
// cookie/redirect/callback URLs. This must be the bare origin (no path) —
// the `/api/v1/authentication` path is added separately via `basePath` in
// src/lib/auth.ts, so appending it here too would double it up.
let baseUrl: string;
if (nodeEnv === 'production') {
	if (!process.env.PRODUCTION_URL) {
		throw new Error(
			'Missing PRODUCTION_URL (required when NODE_ENV=production).',
		);
	}
	baseUrl = process.env.PRODUCTION_URL;
} else {
	baseUrl = `http://localhost:${String(port)}`;
}

if (!process.env.BETTER_AUTH_SECRET) {
	throw new Error(
		'Missing BETTER_AUTH_SECRET. Generate one with `openssl rand -hex 32`.',
	);
}

// Google sign-in is opt-in, not required: set all three vars together to
// enable it, or leave all three blank to run with email/password auth only.
// Requiring Google credentials just to boot the app in local dev would be
// friction most contributors don't need to pay.
const googleClient =
	process.env.GOOGLE_CLIENT_ID &&
	process.env.GOOGLE_CLIENT_SECRET &&
	process.env.GOOGLE_CLIENT_REDIRECT_URI
		? {
				id: process.env.GOOGLE_CLIENT_ID,
				secret: process.env.GOOGLE_CLIENT_SECRET,
				redirectUri: process.env.GOOGLE_CLIENT_REDIRECT_URI,
			}
		: undefined;

const config = {
	port,
	nodeEnv,
	databaseUrl,
	betterAuth: { secret: process.env.BETTER_AUTH_SECRET, url: baseUrl },
	googleClient,
};

export default config;
