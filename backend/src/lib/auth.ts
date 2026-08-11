// Better Auth is the app's entire authentication system: it owns sign-up,
// sign-in, sign-out, session cookies, email verification, and (optionally)
// Google OAuth. Mounting it in src/app.ts exposes a full REST API for all
// of that under basePath below — see the route list in the README.
//
// Earlier drafts of this app also hand-rolled a parallel JWT system
// (sign/verify tokens manually) alongside this. That's gone: having two
// systems that both "do auth" is a bug waiting to happen (whichever one
// nobody remembers to update first), and Better Auth already covers
// everything the hand-rolled one did. src/middleware/authorization.ts reads
// Better Auth's own session instead.
import { betterAuth } from 'better-auth/minimal';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../database/prismaClient.ts';
import config from '../config/env.ts';

export const auth = betterAuth({
	// Every Better Auth endpoint lives under this path, e.g.
	// POST /api/v1/authentication/sign-up/email. Must be mounted at the same
	// path in src/app.ts.
	basePath: '/api/v1/authentication',
	baseURL: config.betterAuth.url,
	secret: config.betterAuth.secret,

	// The frontend runs on a different origin than this API (different port
	// in dev, different domain in production). Better Auth checks incoming
	// requests' Origin header against this list independently of the
	// Express-level `cors()` middleware in app.ts — both have to allow the
	// frontend's origin for cross-origin sign-up/sign-in to work at all.
	trustedOrigins: config.frontendUrl ? [config.frontendUrl] : [],

	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),

	emailAndPassword: {
		enabled: true,
	},

	emailVerification: {
		sendVerificationEmail: ({ user, url }) => {
			// Wire up a real email provider here (Resend, SES, etc.) before
			// going to production — until then this just logs the link so you
			// can verify the flow works end to end in development.
			//
			// Better Auth's type expects a Promise back, but there's nothing
			// to actually await for a synchronous console.log — returning
			// `Promise.resolve()` satisfies that without an `async` keyword
			// that has no `await` in it (which the linter would flag).
			console.log(`Verification email for ${user.email}: ${url}`);
			return Promise.resolve();
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		expiresIn: 3600, // 1 hour
	},

	// Only registers the Google provider when all three credentials are
	// present (see config/env.ts) — so a fresh clone of this repo can sign
	// up with email/password immediately, with zero external accounts to
	// set up first.
	socialProviders: config.googleClient
		? {
				google: {
					clientId: config.googleClient.id,
					clientSecret: config.googleClient.secret,
					redirectURI: config.googleClient.redirectUri,
				},
			}
		: undefined,
});
