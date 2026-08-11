// The frontend counterpart to backend/src/lib/auth.ts. Talks to the same
// Better Auth REST API the backend mounts at /api/v1/authentication — this
// client just wraps those endpoints in typed methods and React hooks
// (useSession below) instead of hand-writing fetch calls everywhere.
//
// No `baseURL` here on purpose: omitted, Better Auth's client defaults to
// `window.location.origin`, i.e. relative requests to the frontend's own
// origin. That's deliberate — see vite.config.ts's dev proxy and
// vercel.json's rewrites, which transparently forward /api/* to the actual
// backend. The browser never talks to the backend's own origin directly,
// which sidesteps cross-site cookie restrictions entirely (Safari's ITP in
// particular blocks third-party SameSite=None cookies for a lot of users,
// even when everything is configured correctly).
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
	basePath: '/api/v1/authentication',
	fetchOptions: {
		credentials: 'include',
	},
});

export const { useSession, signUp, signIn, signOut } = authClient;
