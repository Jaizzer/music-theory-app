import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../../../app.ts';
import { prisma } from '../../../database/prismaClient.ts';

const password = 'a-reasonably-long-test-password';
const emailA = `test-a-${randomUUID()}@example.com`;
const emailB = `test-b-${randomUUID()}@example.com`;
const emailC = `test-c-${randomUUID()}@example.com`;

interface UserResponseBody {
	user: { id: string };
}

describe('GET /api/v1/leaderboard', () => {
	const agentA = request.agent(app);
	const agentB = request.agent(app);
	const agentC = request.agent(app);
	let userAId: string;
	let userBId: string;
	let userCId: string;

	beforeAll(async () => {
		const [responseA, responseB, responseC] = await Promise.all([
			agentA
				.post('/api/v1/authentication/sign-up/email')
				.send({ email: emailA, password, name: 'Leaderboard Test A' }),
			agentB
				.post('/api/v1/authentication/sign-up/email')
				.send({ email: emailB, password, name: 'Leaderboard Test B' }),
			agentC
				.post('/api/v1/authentication/sign-up/email')
				.send({ email: emailC, password, name: 'Leaderboard Test C' }),
		]);
		userAId = (responseA.body as UserResponseBody).user.id;
		userBId = (responseB.body as UserResponseBody).user.id;
		userCId = (responseC.body as UserResponseBody).user.id;

		// A and B become friends; C stays unrelated to either.
		const sendResponse = await agentA
			.post('/api/v1/friends')
			.send({ addresseeEmail: emailB });
		const { id: friendshipId } = (
			sendResponse.body as { friendship: { id: string } }
		).friendship;
		await agentB
			.patch(`/api/v1/friends/${friendshipId}`)
			.send({ status: 'ACCEPTED' });

		// A plays twice (score 10 + 20 = 30 total), B plays once (score 5).
		await agentA.post('/api/v1/game-attempts').send({
			game: 'MODE_DRILL',
			score: 10,
			correctCount: 1,
			totalCount: 1,
			durationSeconds: 5,
		});
		await agentA.post('/api/v1/game-attempts').send({
			game: 'FRETBOARD_IDENTIFIER',
			score: 20,
			correctCount: 2,
			totalCount: 2,
			durationSeconds: 5,
		});
		await agentB.post('/api/v1/game-attempts').send({
			game: 'MODE_DRILL',
			score: 5,
			correctCount: 1,
			totalCount: 2,
			durationSeconds: 5,
		});
		await agentC.post('/api/v1/game-attempts').send({
			game: 'MODE_DRILL',
			score: 1000,
			correctCount: 1,
			totalCount: 1,
			durationSeconds: 5,
		});
	});

	afterAll(async () => {
		await prisma.user.deleteMany({
			where: { id: { in: [userAId, userBId, userCId] } },
		});
		await prisma.$disconnect();
	});

	test('rejects a request with no session', async () => {
		const response = await request(app).get('/api/v1/leaderboard');
		expect(response.status).toBe(401);
	});

	test('scope=global includes everyone, friend or not, with correct totals', async () => {
		const response = await agentA.get('/api/v1/leaderboard?scope=global');
		expect(response.status).toBe(200);
		expect((response.body as { scope: string }).scope).toBe('global');

		const body = response.body as {
			leaderboard: {
				userId: string;
				currentStreak: number;
				totalScore: number;
			}[];
		};
		const byUserId = new Map(
			body.leaderboard.map((entry) => [entry.userId, entry]),
		);

		// C is not a friend of A, but global scope isn't friend-filtered — a
		// shared test database can have users from other suites too, so this
		// checks specific entries are present/correct rather than asserting
		// an exact total count.
		expect(byUserId.has(userCId)).toBe(true);

		const entryA = byUserId.get(userAId);
		expect(entryA?.totalScore).toBe(30);
		expect(entryA?.currentStreak).toBe(1);

		const entryB = byUserId.get(userBId);
		expect(entryB?.totalScore).toBe(5);
		expect(entryB?.currentStreak).toBe(1);
	});

	test('scope=friends includes self and accepted friends, excludes non-friends', async () => {
		const response = await agentA.get('/api/v1/leaderboard?scope=friends');
		expect(response.status).toBe(200);
		expect((response.body as { scope: string }).scope).toBe('friends');

		const body = response.body as {
			leaderboard: { userId: string; totalScore: number }[];
		};
		const byUserId = new Map(
			body.leaderboard.map((entry) => [entry.userId, entry]),
		);

		expect(byUserId.has(userCId)).toBe(false);
		expect(byUserId.get(userAId)?.totalScore).toBe(30);
		expect(byUserId.get(userBId)?.totalScore).toBe(5);
	});

	test('an invalid scope value falls back to global rather than erroring', async () => {
		const response = await agentA.get('/api/v1/leaderboard?scope=nonsense');
		expect(response.status).toBe(200);
		expect((response.body as { scope: string }).scope).toBe('global');
	});
});
