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
const otherEmail = `test-other-${randomUUID()}@example.com`;
const password = 'a-reasonably-long-test-password';

describe('game-attempts', () => {
	const signedInAgent = request.agent(app);
	const otherAgent = request.agent(app);
	let userId: string;
	let otherUserId: string;

	beforeAll(async () => {
		const response = await signedInAgent
			.post('/api/v1/authentication/sign-up/email')
			.send({ email, password, name: 'Game Attempts Test' });
		userId = (response.body as { user: { id: string } }).user.id;

		const otherResponse = await otherAgent
			.post('/api/v1/authentication/sign-up/email')
			.send({ email: otherEmail, password, name: 'Other User' });
		otherUserId = (otherResponse.body as { user: { id: string } }).user.id;
	});

	afterAll(async () => {
		await prisma.user.deleteMany({
			where: { id: { in: [userId, otherUserId] } },
		});
		await prisma.$disconnect();
	});

	describe('POST /api/v1/game-attempts', () => {
		test('rejects a request with no session', async () => {
			const response = await request(app)
				.post('/api/v1/game-attempts')
				.send({ game: 'MODE_DRILL' });
			expect(response.status).toBe(401);
		});

		test('rejects an invalid body', async () => {
			const response = await signedInAgent
				.post('/api/v1/game-attempts')
				.send({ game: 'NOT_A_REAL_GAME' });
			expect(response.status).toBe(400);
		});

		test('creates a zeroed attempt and starts a streak at 1', async () => {
			const response = await signedInAgent
				.post('/api/v1/game-attempts')
				.send({ game: 'MODE_DRILL' });

			expect(response.status).toBe(201);
			const body = response.body as {
				attempt: {
					userId: string;
					game: string;
					points: number;
					correctCount: number;
					totalCount: number;
				};
				streak: { currentStreak: number; longestStreak: number };
			};
			expect(body.attempt.userId).toBe(userId);
			expect(body.attempt.game).toBe('MODE_DRILL');
			expect(body.attempt.points).toBe(0);
			expect(body.attempt.correctCount).toBe(0);
			expect(body.attempt.totalCount).toBe(0);
			expect(body.streak.currentStreak).toBe(1);
			expect(body.streak.longestStreak).toBe(1);
		});

		test('a second attempt the same day does not double the streak', async () => {
			const response = await signedInAgent
				.post('/api/v1/game-attempts')
				.send({ game: 'FRETBOARD_IDENTIFIER' });

			expect(response.status).toBe(201);
			const body = response.body as { streak: { currentStreak: number } };
			expect(body.streak.currentStreak).toBe(1);
		});
	});

	describe('PATCH /api/v1/game-attempts/:id', () => {
		async function createAttempt(agent: typeof signedInAgent) {
			const response = await agent
				.post('/api/v1/game-attempts')
				.send({ game: 'SCALE_DEGREE' });
			return (response.body as { attempt: { id: string } }).attempt.id;
		}

		test('rejects a request with no session', async () => {
			const attemptId = await createAttempt(signedInAgent);
			const response = await request(app)
				.patch(`/api/v1/game-attempts/${attemptId}`)
				.send({
					points: 5,
					correctCount: 1,
					totalCount: 1,
					durationSeconds: 3,
				});
			expect(response.status).toBe(401);
		});

		test('rejects an invalid body', async () => {
			const attemptId = await createAttempt(signedInAgent);
			const response = await signedInAgent
				.patch(`/api/v1/game-attempts/${attemptId}`)
				.send({ points: -1 });
			expect(response.status).toBe(400);
		});

		test('rejects an attempt id that does not belong to the caller', async () => {
			const otherAttemptId = await createAttempt(otherAgent);
			const response = await signedInAgent
				.patch(`/api/v1/game-attempts/${otherAttemptId}`)
				.send({
					points: 5,
					correctCount: 1,
					totalCount: 1,
					durationSeconds: 3,
				});
			expect(response.status).toBe(404);
		});

		test('rejects a nonexistent attempt id', async () => {
			const response = await signedInAgent
				.patch(`/api/v1/game-attempts/${randomUUID()}`)
				.send({
					points: 5,
					correctCount: 1,
					totalCount: 1,
					durationSeconds: 3,
				});
			expect(response.status).toBe(404);
		});

		test('updates the attempt in place', async () => {
			const attemptId = await createAttempt(signedInAgent);

			const response = await signedInAgent
				.patch(`/api/v1/game-attempts/${attemptId}`)
				.send({
					points: 17,
					correctCount: 3,
					totalCount: 4,
					durationSeconds: 42,
				});
			expect(response.status).toBe(200);

			const persisted = await prisma.gameAttempt.findUniqueOrThrow({
				where: { id: attemptId },
			});
			expect(persisted.points).toBe(17);
			expect(persisted.correctCount).toBe(3);
			expect(persisted.totalCount).toBe(4);
			expect(persisted.durationSeconds).toBe(42);
		});
	});
});
