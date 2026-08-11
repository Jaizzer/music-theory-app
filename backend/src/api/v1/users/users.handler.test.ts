// An integration test, not a unit test: it runs real HTTP requests through
// the real Express app against the real (test) Postgres database — see
// TEST_DATABASE_URL in .env, selected automatically because jest.config.ts
// sets NODE_ENV=test. No mocking, because the interesting behavior here
// (auth cookies, 401/403 rules) lives in the seams between Express, Better
// Auth, and Prisma — mocking any of them would test something else.
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../../../app.ts';
import { prisma } from '../../../database/prismaClient.ts';

// A fresh, guaranteed-unique email per test run, since User.email is unique
// in the schema — reusing a fixed email would make the second test run
// ever fail on a stale database.
const email = `test-${randomUUID()}@example.com`;
const password = 'a-reasonably-long-test-password';

// supertest types `response.body` as `any` (it can't know our route shapes
// ahead of time), which trips the strict-typechecked ESLint rules the
// moment we touch a property on it. This narrows it back to something
// typed, in one place, instead of an `any` access at every call site.
interface UserResponseBody {
	user: { id: string; email: string; name: string | null };
}

function userFrom(response: request.Response) {
	return (response.body as UserResponseBody).user;
}

describe('/api/v1/users/:id', () => {
	// `request.agent(app)` — unlike a plain `request(app)` — persists cookies
	// across calls, the same way a browser would. That's what lets
	// `signedInAgent` carry the session cookie from sign-up into the
	// requests below without manually copying Set-Cookie headers around.
	const signedInAgent = request.agent(app);
	let userId: string;

	// Runs once before any test in this file — sign-up doubles as both the
	// setup step and an implicit test that the auth route itself works.
	beforeAll(async () => {
		const response = await signedInAgent
			.post('/api/v1/authentication/sign-up/email')
			.send({ email, password, name: 'Test User' });

		expect(response.status).toBe(200);
		userId = userFrom(response).id;
	});

	afterAll(async () => {
		// Cascading delete (see schema.prisma's onDelete: Cascade) removes
		// the Session/Account rows this user picked up along the way too.
		await prisma.user.delete({ where: { id: userId } });
		await prisma.$disconnect();
	});

	test('rejects a request with no session', async () => {
		const response = await request(app).get(`/api/v1/users/${userId}`);
		expect(response.status).toBe(401);
	});

	test("rejects a signed-in user reading someone else's id", async () => {
		const response = await signedInAgent.get(
			`/api/v1/users/${randomUUID()}`,
		);
		expect(response.status).toBe(403);
	});

	test('returns the signed-in user their own profile', async () => {
		const response = await signedInAgent.get(`/api/v1/users/${userId}`);
		expect(response.status).toBe(200);
		expect(userFrom(response).email).toBe(email);
	});

	test('lets the signed-in user update their own name', async () => {
		const response = await signedInAgent
			.put(`/api/v1/users/${userId}`)
			.send({ name: 'Updated Name' });

		expect(response.status).toBe(200);
		expect(userFrom(response).name).toBe('Updated Name');
	});

	test('rejects an update with an invalid body', async () => {
		const response = await signedInAgent
			.put(`/api/v1/users/${userId}`)
			.send({ name: '' });

		expect(response.status).toBe(400);
	});
});
