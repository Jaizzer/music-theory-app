// The streak algorithm, isolated as a pure function of (current streak
// state, now) -> (new streak state) — no DB, no Date.now() called
// internally. That's what makes every edge case (same-day dedup, next-day
// increment, within-grace increment, broken-streak reset) directly and
// cheaply unit-testable: see game-attempts.streak.test.ts.
//
// Deliberately UTC-calendar-day based rather than per-user-timezone based.
// `streakDate` is always truncated to UTC midnight and only ever advances
// once per calendar day, which is what prevents a bug where multiple
// same-day practice sessions could each reset the eligibility window.
// GRACE_HOURS is added on top of the two-day boundary so a session that
// lands shortly after a UTC day rolls over still counts as consecutive —
// a deliberate simplification of "true" per-user-timezone fairness in
// exchange for being simple enough to actually reason about and test.
const GRACE_HOURS = 6;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export interface StreakState {
	currentStreak: number;
	longestStreak: number;
	streakDate: Date | null;
}

function startOfUtcDay(date: Date): Date {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	);
}

export function computeStreakUpdate(
	streak: StreakState,
	now: Date,
): StreakState {
	const today = startOfUtcDay(now);

	// First practice session ever.
	if (!streak.streakDate) {
		return {
			currentStreak: 1,
			longestStreak: Math.max(1, streak.longestStreak),
			streakDate: today,
		};
	}

	// Already practiced today — dedupe rather than double-counting or
	// resetting on a second session the same day.
	if (today.getTime() === streak.streakDate.getTime()) {
		return streak;
	}

	// Consecutive if `now` falls before the grace deadline: two full days
	// after the last streak day, plus the grace buffer. E.g. last streak day
	// Monday -> deadline is Wednesday 06:00 UTC (with the default 6h grace),
	// so any practice on Tuesday, or early Wednesday, still extends it.
	const graceDeadline =
		streak.streakDate.getTime() +
		2 * MS_PER_DAY +
		GRACE_HOURS * MS_PER_HOUR;

	if (now.getTime() < graceDeadline) {
		const currentStreak = streak.currentStreak + 1;
		return {
			currentStreak,
			longestStreak: Math.max(currentStreak, streak.longestStreak),
			streakDate: today,
		};
	}

	// Too much time passed — streak broken, starting fresh today.
	return {
		currentStreak: 1,
		longestStreak: Math.max(1, streak.longestStreak),
		streakDate: today,
	};
}
