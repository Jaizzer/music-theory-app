import { prisma } from '../../../database/prismaClient.ts';
import { computeStreakUpdate } from './game-attempts.streak.ts';
import type { GameSlug } from '../../../database/generated/enums.ts';

interface CreateGameAttemptInput {
	userId: string;
	game: GameSlug;
	score: number;
	correctCount: number;
	totalCount: number;
	durationSeconds: number;
}

// A transaction, not two separate writes: the attempt record and the
// streak update must both land or neither does — an attempt that silently
// failed to update the streak would be a very confusing bug to chase down
// later.
export async function createGameAttempt(input: CreateGameAttemptInput) {
	const now = new Date();

	return prisma.$transaction(async (tx) => {
		const attempt = await tx.gameAttempt.create({
			data: {
				userId: input.userId,
				game: input.game,
				score: input.score,
				correctCount: input.correctCount,
				totalCount: input.totalCount,
				durationSeconds: input.durationSeconds,
				playedAt: now,
			},
		});

		const existingStreak = await tx.streak.findUnique({
			where: { userId: input.userId },
		});
		const nextStreak = computeStreakUpdate(
			existingStreak ?? {
				currentStreak: 0,
				longestStreak: 0,
				streakDate: null,
			},
			now,
		);

		const streak = await tx.streak.upsert({
			where: { userId: input.userId },
			create: {
				userId: input.userId,
				...nextStreak,
				lastPracticedAt: now,
			},
			update: { ...nextStreak, lastPracticedAt: now },
		});

		return { attempt, streak };
	});
}
