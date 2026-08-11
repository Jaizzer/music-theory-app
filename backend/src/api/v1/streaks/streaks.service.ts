import { prisma } from '../../../database/prismaClient.ts';

// A new user has no Streak row yet (one is only created on their first
// game-attempts submission — see game-attempts.service.ts's upsert), so
// this returns sensible zeroed defaults rather than null, letting the
// frontend render a "0-day streak" state without a special case.
export async function getOwnStreak(userId: string) {
	const streak = await prisma.streak.findUnique({ where: { userId } });

	return (
		streak ?? {
			userId,
			currentStreak: 0,
			longestStreak: 0,
			streakDate: null,
			lastPracticedAt: null,
		}
	);
}
