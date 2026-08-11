// A thin fetch wrapper for the backend's non-auth routes (currently just
// /api/v1/users and /api/v1/health). Auth routes go through authClient.ts
// instead, which already knows how to talk to Better Auth's API shape.
import config from '../config/env.ts';

export class ApiError extends Error {
	// Not a constructor parameter property (`public status: number` in the
	// constructor signature) — tsconfig.app.json's erasableSyntaxOnly rejects
	// that, since it's TypeScript-only syntax that can't just be stripped to
	// get valid JS. Explicit field + assignment compiles to plain JS either way.
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

export async function apiFetch<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(`${config.apiUrl}${path}`, {
		...options,
		// Required for the browser to send the Better Auth session cookie —
		// same reasoning as authClient.ts's fetchOptions.credentials.
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...options.headers },
	});

	const body: unknown = await response.json();

	if (!response.ok) {
		const message =
			typeof body === 'object' && body !== null && 'message' in body
				? String((body as { message: unknown }).message)
				: response.statusText;
		throw new ApiError(response.status, message);
	}

	return body as T;
}
