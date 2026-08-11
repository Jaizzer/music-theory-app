// Only the overall flow is covered here (attempt persisted, streak
// upserted alongside it) — the streak algorithm's own edge cases already
// have thorough coverage in game-attempts.streak.test.ts as fast unit
// tests, so this doesn't need to re-derive them against a real database.
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../../../app.ts';
import { prisma } from '../../../database/prismaClient.ts';

const email = `test-${randomUUID()}@example.com`;
const password = 'a-reasonably-long-test-password';

describe('POST /api/v1/game-attempts', () => {
	const signedInAgent = request.agent(app);
	let userId: string;

	beforeAll(async () => {
		const response = await signedInAgent
			.post('/api/v1/authentication/sign-up/email')
			.send({ email, password, name: 'Game Attempts Test' });
		userId = (response.body as { user: { id: string } }).user.id;
	});

	afterAll(async () => {
		await prisma.user.delete({ where: { id: userId } });
		await prisma.$disconnect();
	});

	test('rejects a request with no session', async () => {
		const response = await request(app).post('/api/v1/game-attempts').send({
			game: 'MODE_DRILL',
			points: 10,
			correctCount: 1,
			totalCount: 1,
			durationSeconds: 5,
		});
		expect(response.status).toBe(401);
	});

	test('rejects an invalid body', async () => {
		const response = await signedInAgent
			.post('/api/v1/game-attempts')
			.send({ game: 'NOT_A_REAL_GAME', points: 10 });
		expect(response.status).toBe(400);
	});

	test('records an attempt and starts a streak at 1', async () => {
		const response = await signedInAgent
			.post('/api/v1/game-attempts')
			.send({
				game: 'MODE_DRILL',
				points: 10,
				correctCount: 1,
				totalCount: 1,
				durationSeconds: 5,
			});

		expect(response.status).toBe(201);
		const body = response.body as {
			attempt: { userId: string; game: string; points: number };
			streak: { currentStreak: number; longestStreak: number };
		};
		expect(body.attempt.userId).toBe(userId);
		expect(body.attempt.game).toBe('MODE_DRILL');
		expect(body.streak.currentStreak).toBe(1);
		expect(body.streak.longestStreak).toBe(1);
	});

	test('a second attempt the same day does not double the streak', async () => {
		const response = await signedInAgent
			.post('/api/v1/game-attempts')
			.send({
				game: 'FRETBOARD_IDENTIFIER',
				points: 20,
				correctCount: 2,
				totalCount: 2,
				durationSeconds: 8,
			});

		expect(response.status).toBe(201);
		const body = response.body as { streak: { currentStreak: number } };
		expect(body.streak.currentStreak).toBe(1);
	});
});
