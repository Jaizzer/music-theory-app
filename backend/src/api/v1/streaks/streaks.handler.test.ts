import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../../../app.ts';
import { prisma } from '../../../database/prismaClient.ts';

const email = `test-${randomUUID()}@example.com`;
const password = 'a-reasonably-long-test-password';

describe('GET /api/v1/streaks/me', () => {
	const signedInAgent = request.agent(app);
	let userId: string;

	beforeAll(async () => {
		const response = await signedInAgent
			.post('/api/v1/authentication/sign-up/email')
			.send({ email, password, name: 'Streaks Test' });
		userId = (response.body as { user: { id: string } }).user.id;
	});

	afterAll(async () => {
		await prisma.user.delete({ where: { id: userId } });
		await prisma.$disconnect();
	});

	test('rejects a request with no session', async () => {
		const response = await request(app).get('/api/v1/streaks/me');
		expect(response.status).toBe(401);
	});

	test('returns zeroed defaults before any attempt is recorded', async () => {
		const response = await signedInAgent.get('/api/v1/streaks/me');
		expect(response.status).toBe(200);
		const body = response.body as {
			streak: { currentStreak: number; longestStreak: number };
		};
		expect(body.streak.currentStreak).toBe(0);
		expect(body.streak.longestStreak).toBe(0);
	});

	test('reflects a streak after a game attempt session starts', async () => {
		// The streak updates the moment a session is created, not when it
		// finishes — see game-attempts.service.ts's createGameAttempt.
		await signedInAgent
			.post('/api/v1/game-attempts')
			.send({ game: 'MODE_DRILL' });

		const response = await signedInAgent.get('/api/v1/streaks/me');
		expect(response.status).toBe(200);
		const body = response.body as { streak: { currentStreak: number } };
		expect(body.streak.currentStreak).toBe(1);
	});
});
