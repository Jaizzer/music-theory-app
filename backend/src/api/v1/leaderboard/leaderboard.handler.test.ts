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

describe('GET /api/v1/leaderboard/me', () => {
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
		const response = await request(app).get('/api/v1/leaderboard/me');
		expect(response.status).toBe(401);
	});

	test('includes self and accepted friends, excludes non-friends, with correct totals', async () => {
		const response = await agentA.get('/api/v1/leaderboard/me');
		expect(response.status).toBe(200);

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

		expect(byUserId.has(userCId)).toBe(false);

		const entryA = byUserId.get(userAId);
		expect(entryA?.totalScore).toBe(30);
		expect(entryA?.currentStreak).toBe(1);

		const entryB = byUserId.get(userBId);
		expect(entryB?.totalScore).toBe(5);
		expect(entryB?.currentStreak).toBe(1);
	});
});
