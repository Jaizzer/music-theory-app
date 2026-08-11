// Unit test for a pure function, not an integration test — locking this
// down after a real production incident: Better Auth rejected sign-ups
// from Vercel's per-deployment preview URLs (e.g.
// music-theory-app-frontend-6kkanu9s1-jaizzers-projects.vercel.app)
// because only the stable FRONTEND_URL alias was trusted.
import { describe, test, expect } from '@jest/globals';
import { vercelPreviewOriginPattern } from './auth.ts';

describe('vercelPreviewOriginPattern', () => {
	test('derives a wildcard scoped to the project hostname prefix', () => {
		expect(
			vercelPreviewOriginPattern(
				'https://music-theory-app-frontend.vercel.app',
			),
		).toBe('https://music-theory-app-frontend-*.vercel.app');
	});

	test('the pattern brackets the exact preview URL that failed in production', () => {
		const pattern =
			vercelPreviewOriginPattern(
				'https://music-theory-app-frontend.vercel.app',
			) ?? '';
		const [prefix, suffix] = pattern.split('*');
		const realPreviewUrlFromTheIncident =
			'https://music-theory-app-frontend-6kkanu9s1-jaizzers-projects.vercel.app';

		expect(realPreviewUrlFromTheIncident.startsWith(prefix ?? '')).toBe(
			true,
		);
		expect(realPreviewUrlFromTheIncident.endsWith(suffix ?? '')).toBe(true);
	});

	test('returns undefined for a non-vercel.app URL (e.g. local dev or a custom domain)', () => {
		expect(
			vercelPreviewOriginPattern('http://localhost:5173'),
		).toBeUndefined();
		expect(
			vercelPreviewOriginPattern('https://app.example.com'),
		).toBeUndefined();
	});
});
