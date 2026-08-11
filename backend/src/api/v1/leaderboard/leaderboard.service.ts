import { prisma } from '../../../database/prismaClient.ts';
import getAcceptedFriendIds from '../../../services/getAcceptedFriendIds.ts';

export interface LeaderboardEntry {
	userId: string;
	name: string | null;
	currentStreak: number;
	longestStreak: number;
	totalPoints: number;
}

export type LeaderboardScope = 'global' | 'friends';

// Returns everyone (scope: 'global') or just the caller plus their accepted
// friends (scope: 'friends'), each with both ranking metrics (current
// streak, total points) in one response — the frontend switches which one
// it sorts/displays by, rather than this hitting the API twice per tab
// switch. No pagination yet — this is a brand-new app with a handful of
// users; add a real limit once the user base is actually large enough for
// an unbounded `findMany` to matter.
//
// Two queries total regardless of scope — not N+1: one findMany (joined to
// each user's Streak row) and one groupBy (summed points across every
// GameAttempt), merged in application code. This is the concrete version
// of the N+1-avoidance the project's backstory claims.
export async function getLeaderboard(
	userId: string,
	scope: LeaderboardScope,
): Promise<LeaderboardEntry[]> {
	const memberIds =
		scope === 'friends'
			? [userId, ...(await getAcceptedFriendIds(userId))]
			: undefined;
	const membershipFilter = memberIds ? { id: { in: memberIds } } : {};

	const [users, pointSums] = await Promise.all([
		prisma.user.findMany({
			where: membershipFilter,
			select: { id: true, name: true, streak: true },
		}),
		prisma.gameAttempt.groupBy({
			by: ['userId'],
			where: memberIds ? { userId: { in: memberIds } } : {},
			_sum: { points: true },
		}),
	]);

	const totalPointsByUserId = new Map(
		pointSums.map((row) => [row.userId, row._sum.points ?? 0]),
	);

	return users.map((user) => ({
		userId: user.id,
		name: user.name,
		currentStreak: user.streak?.currentStreak ?? 0,
		longestStreak: user.streak?.longestStreak ?? 0,
		totalPoints: totalPointsByUserId.get(user.id) ?? 0,
	}));
}
