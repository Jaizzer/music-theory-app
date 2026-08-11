import { prisma } from '../../../database/prismaClient.ts';
import getUserByEmail from '../../../services/getUserByEmail.ts';
import { FriendshipStatus } from '../../../database/generated/enums.ts';

// Thrown for anything that's the client's fault (bad email, duplicate
// request, responding to someone else's request) — friends.handler.ts
// catches this specifically and responds 400/404 instead of letting it
// fall through to the generic 500 error handler.
export class FriendshipError extends Error {}

export async function sendFriendRequest(
	requesterId: string,
	addresseeEmail: string,
) {
	const addressee = await getUserByEmail(addresseeEmail);
	if (!addressee) {
		throw new FriendshipError('No user with that email.');
	}
	if (addressee.id === requesterId) {
		throw new FriendshipError('Cannot send a friend request to yourself.');
	}

	// A request already exists in either direction — including a past
	// decline, so a declined request can't just be silently resent.
	const existing = await prisma.friendship.findFirst({
		where: {
			OR: [
				{ requesterId, addresseeId: addressee.id },
				{ requesterId: addressee.id, addresseeId: requesterId },
			],
		},
	});
	if (existing) {
		throw new FriendshipError(
			'A friend request already exists between these users.',
		);
	}

	return prisma.friendship.create({
		data: {
			requesterId,
			addresseeId: addressee.id,
			status: FriendshipStatus.PENDING,
		},
	});
}

export async function respondToFriendRequest(
	friendshipId: string,
	addresseeId: string,
	status: typeof FriendshipStatus.ACCEPTED | typeof FriendshipStatus.DECLINED,
) {
	const friendship = await prisma.friendship.findUnique({
		where: { id: friendshipId },
	});

	// Not found AND "found but you're not the addressee" both return the
	// same "not found" error — a PENDING request's existence shouldn't be
	// discoverable by someone it wasn't sent to.
	if (friendship?.addresseeId !== addresseeId) {
		throw new FriendshipError('Friend request not found.');
	}

	return prisma.friendship.update({
		where: { id: friendshipId },
		data: { status },
	});
}

const PUBLIC_USER_FIELDS = { id: true, name: true, email: true } as const;

export async function listFriends(userId: string) {
	const friendships = await prisma.friendship.findMany({
		where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
		include: {
			requester: { select: PUBLIC_USER_FIELDS },
			addressee: { select: PUBLIC_USER_FIELDS },
		},
	});

	const friends = [];
	const incomingRequests = [];
	const outgoingRequests = [];

	for (const friendship of friendships) {
		const isRequester = friendship.requesterId === userId;
		const otherUser = isRequester
			? friendship.addressee
			: friendship.requester;

		if (friendship.status === FriendshipStatus.ACCEPTED) {
			friends.push(otherUser);
		} else if (friendship.status === FriendshipStatus.PENDING) {
			const entry = { friendshipId: friendship.id, user: otherUser };
			if (isRequester) {
				outgoingRequests.push(entry);
			} else {
				incomingRequests.push(entry);
			}
		}
	}

	return { friends, incomingRequests, outgoingRequests };
}
