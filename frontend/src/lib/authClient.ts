// The frontend counterpart to backend/src/lib/auth.ts. Talks to the same
// Better Auth REST API the backend mounts at /api/v1/authentication — this
// client just wraps those endpoints in typed methods and React hooks
// (useSession below) instead of hand-writing fetch calls everywhere.
import { createAuthClient } from 'better-auth/react';
import config from '../config/env.ts';

export const authClient = createAuthClient({
	baseURL: config.apiUrl,
	basePath: '/api/v1/authentication',
	// The backend and frontend run on different ports in dev (3000 vs 5173),
	// which makes every request cross-origin. Without `credentials: 'include'`
	// here, the browser would never attach the session cookie to requests —
	// pairing this with `cors({ origin: true, credentials: true })` on the
	// backend (src/app.ts) is what makes cross-origin cookies work at all.
	fetchOptions: {
		credentials: 'include',
	},
});

export const { useSession, signUp, signIn, signOut } = authClient;
