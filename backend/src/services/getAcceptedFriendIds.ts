import { prisma } from '../database/prismaClient.ts';
import { FriendshipStatus } from '../database/generated/enums.ts';

// Used by the leaderboard feature (to know whose scores/streaks to
// include) and conceptually by the friends feature's own listing logic —
// two consumers, so it lives here rather than inside either feature.
export default async function getAcceptedFriendIds(
	userId: string,
): Promise<string[]> {
	const friendships = await prisma.friendship.findMany({
		where: {
			status: FriendshipStatus.ACCEPTED,
			OR: [{ requesterId: userId }, { addresseeId: userId }],
		},
		select: { requesterId: true, addresseeId: true },
	});

	return friendships.map((friendship) =>
		friendship.requesterId === userId
			? friendship.addresseeId
			: friendship.requesterId,
	);
}
