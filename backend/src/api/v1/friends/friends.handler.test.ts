import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../../../app.ts';
import { prisma } from '../../../database/prismaClient.ts';

const password = 'a-reasonably-long-test-password';
const emailA = `test-a-${randomUUID()}@example.com`;
const emailB = `test-b-${randomUUID()}@example.com`;

interface UserResponseBody {
	user: { id: string };
}

describe('/api/v1/friends', () => {
	const agentA = request.agent(app);
	const agentB = request.agent(app);
	let userAId: string;
	let userBId: string;

	beforeAll(async () => {
		const responseA = await agentA
			.post('/api/v1/authentication/sign-up/email')
			.send({ email: emailA, password, name: 'Friend Test A' });
		const responseB = await agentB
			.post('/api/v1/authentication/sign-up/email')
			.send({ email: emailB, password, name: 'Friend Test B' });

		userAId = (responseA.body as UserResponseBody).user.id;
		userBId = (responseB.body as UserResponseBody).user.id;
	});

	afterAll(async () => {
		// Friendship rows cascade-delete with either side's User row.
		await prisma.user.deleteMany({
			where: { id: { in: [userAId, userBId] } },
		});
		await prisma.$disconnect();
	});

	test('rejects sending a request to yourself', async () => {
		const response = await agentA
			.post('/api/v1/friends')
			.send({ addresseeEmail: emailA });
		expect(response.status).toBe(400);
	});

	test('rejects sending a request to an unknown email', async () => {
		const response = await agentA
			.post('/api/v1/friends')
			.send({ addresseeEmail: `nobody-${randomUUID()}@example.com` });
		expect(response.status).toBe(400);
	});

	let friendshipId: string;

	test('A can send B a friend request', async () => {
		const response = await agentA
			.post('/api/v1/friends')
			.send({ addresseeEmail: emailB });
		expect(response.status).toBe(201);
		const body = response.body as {
			friendship: { id: string; status: string };
		};
		expect(body.friendship.status).toBe('PENDING');
		friendshipId = body.friendship.id;
	});

	test('rejects a duplicate request between the same two users', async () => {
		const response = await agentA
			.post('/api/v1/friends')
			.send({ addresseeEmail: emailB });
		expect(response.status).toBe(400);
	});

	test('B sees the incoming request, A sees it as outgoing', async () => {
		const responseB = await agentB.get('/api/v1/friends');
		const bodyB = responseB.body as {
			incomingRequests: { user: { id: string } }[];
		};
		expect(bodyB.incomingRequests).toHaveLength(1);
		expect(bodyB.incomingRequests[0]?.user.id).toBe(userAId);

		const responseA = await agentA.get('/api/v1/friends');
		const bodyA = responseA.body as {
			outgoingRequests: { user: { id: string } }[];
		};
		expect(bodyA.outgoingRequests).toHaveLength(1);
		expect(bodyA.outgoingRequests[0]?.user.id).toBe(userBId);
	});

	test('a stranger cannot respond to a request that is not theirs', async () => {
		const response = await agentA
			.patch(`/api/v1/friends/${friendshipId}`)
			.send({ status: 'ACCEPTED' });
		expect(response.status).toBe(404);
	});

	test('B accepts the request, and both now list each other as friends', async () => {
		const acceptResponse = await agentB
			.patch(`/api/v1/friends/${friendshipId}`)
			.send({ status: 'ACCEPTED' });
		expect(acceptResponse.status).toBe(200);

		const responseA = await agentA.get('/api/v1/friends');
		const bodyA = responseA.body as { friends: { id: string }[] };
		expect(bodyA.friends.map((friend) => friend.id)).toContain(userBId);

		const responseB = await agentB.get('/api/v1/friends');
		const bodyB = responseB.body as { friends: { id: string }[] };
		expect(bodyB.friends.map((friend) => friend.id)).toContain(userAId);
	});
});
