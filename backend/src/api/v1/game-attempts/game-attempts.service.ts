import { prisma } from '../../../database/prismaClient.ts';
import { computeStreakUpdate } from './game-attempts.streak.ts';
import type { GameSlug } from '../../../database/generated/enums.ts';

interface UpdateGameAttemptInput {
	points: number;
	correctCount: number;
	totalCount: number;
	durationSeconds: number;
}

// Called once, when a session starts — the row is created zeroed out and
// filled in via updateGameAttempt as the session progresses (see that
// function below for why). A transaction, not two separate writes: the
// attempt record and the streak update must both land or neither does —
// an attempt that silently failed to update the streak would be a very
// confusing bug to chase down later.
//
// The streak updates here, at session *start*, rather than at some later
// "completion" — a player who opens a game and closes it immediately
// still gets today's practice credited, instead of needing to reach a
// "complete" state that may never happen.
export async function createGameAttempt(userId: string, game: GameSlug) {
	const now = new Date();

	return prisma.$transaction(async (tx) => {
		const attempt = await tx.gameAttempt.create({
			data: {
				userId,
				game,
				points: 0,
				correctCount: 0,
				totalCount: 0,
				durationSeconds: 0,
				playedAt: now,
			},
		});

		const existingStreak = await tx.streak.findUnique({
			where: { userId },
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
			where: { userId },
			create: {
				userId,
				...nextStreak,
				lastPracticedAt: now,
			},
			update: { ...nextStreak, lastPracticedAt: now },
		});

		return { attempt, streak };
	});
}

// Called after every answer during a session, always with the full
// cumulative state (not a delta) — this is what makes progress durable
// against a closed tab: whatever the last successful call here was *is*
// the saved state, there's no separate "final submit" to lose.
//
// `updateMany` with `userId` in the `where` (not just `id`) doubles as
// the ownership check in one query — a mismatched id or a mismatched
// owner both just come back with count 0, indistinguishable from "not
// found" on purpose, so this never leaks whether an attempt id exists at
// all to a caller who doesn't own it.
export async function updateGameAttempt(
	attemptId: string,
	userId: string,
	input: UpdateGameAttemptInput,
): Promise<boolean> {
	const result = await prisma.gameAttempt.updateMany({
		where: { id: attemptId, userId },
		data: input,
	});
	return result.count > 0;
}
