// A smoke test, not a full integration test — it stubs fetch entirely
// rather than hitting a real backend, so it only proves the component tree
// renders without throwing. See backend/src/api/v1/users/users.handler.test.ts
// for what a real integration test (hitting a real server) looks like.
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.tsx';

beforeEach(() => {
	vi.stubGlobal(
		'fetch',
		vi.fn((url: string) => {
			// Better Auth's useSession hook checks this endpoint on mount;
			// answering "no session" here is what makes the sign-up/sign-in
			// form (rather than the profile view) show up in this test.
			if (url.includes('get-session')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(null),
				});
			}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ status: 'ok' }),
			});
		}),
	);
});

describe('App', () => {
	test('renders the page heading and the sign-up form', async () => {
		render(<App />);

		expect(
			screen.getByRole('heading', { name: 'Music Theory App' }),
		).toBeInTheDocument();
		expect(await screen.findByPlaceholderText('Email')).toBeInTheDocument();
	});
});
