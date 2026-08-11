/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		// Pinned rather than left to Vite's default-port-hunting, because the
		// backend's Better Auth config (backend/src/lib/auth.ts) has to know
		// this exact origin in advance to trust cross-origin requests from it.
		port: 5173,
		// If 5173 is already taken (e.g. by another Vite project), Vite's
		// default behavior is to silently move to the next free port —
		// which would then mismatch the backend's trustedOrigins and break
		// sign-in with a confusing CORS error. Fail loudly instead.
		strictPort: true,
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './vitest.setup.ts',
	},
});
