// Unit tests, not integration tests — computeStreakUpdate is a pure
// function with no DB/HTTP involved, exactly the case earlier discussion
// flagged as actually worth unit-testing rather than always reaching for
// an integration test.
import { describe, test, expect } from '@jest/globals';
import {
	computeStreakUpdate,
	type StreakState,
} from './game-attempts.streak.ts';

const noStreak: StreakState = {
	currentStreak: 0,
	longestStreak: 0,
	streakDate: null,
};

describe('computeStreakUpdate', () => {
	test('starts a streak at 1 on the first-ever practice', () => {
		const result = computeStreakUpdate(
			noStreak,
			new Date('2026-01-01T10:00:00Z'),
		);
		expect(result).toEqual({
			currentStreak: 1,
			longestStreak: 1,
			streakDate: new Date('2026-01-01T00:00:00Z'),
		});
	});

	test('dedupes a second session on the same UTC day', () => {
		const streak: StreakState = {
			currentStreak: 3,
			longestStreak: 5,
			streakDate: new Date('2026-01-01T00:00:00Z'),
		};
		const result = computeStreakUpdate(
			streak,
			new Date('2026-01-01T22:00:00Z'),
		);
		expect(result).toEqual(streak);
	});

	test('extends the streak on the very next UTC day', () => {
		const streak: StreakState = {
			currentStreak: 3,
			longestStreak: 5,
			streakDate: new Date('2026-01-01T00:00:00Z'),
		};
		const result = computeStreakUpdate(
			streak,
			new Date('2026-01-02T09:00:00Z'),
		);
		expect(result).toEqual({
			currentStreak: 4,
			longestStreak: 5,
			streakDate: new Date('2026-01-02T00:00:00Z'),
		});
	});

	test('extends the streak within the grace window after a missed day', () => {
		// Last streak day Jan 1. Jan 2 is skipped entirely. Grace deadline is
		// Jan 3 06:00 UTC — practicing at Jan 3 05:00 UTC should still count.
		const streak: StreakState = {
			currentStreak: 3,
			longestStreak: 5,
			streakDate: new Date('2026-01-01T00:00:00Z'),
		};
		const result = computeStreakUpdate(
			streak,
			new Date('2026-01-03T05:00:00Z'),
		);
		expect(result).toEqual({
			currentStreak: 4,
			longestStreak: 5,
			streakDate: new Date('2026-01-03T00:00:00Z'),
		});
	});

	test('breaks the streak once the grace deadline has passed', () => {
		const streak: StreakState = {
			currentStreak: 3,
			longestStreak: 5,
			streakDate: new Date('2026-01-01T00:00:00Z'),
		};
		const result = computeStreakUpdate(
			streak,
			new Date('2026-01-03T07:00:00Z'),
		);
		expect(result).toEqual({
			currentStreak: 1,
			longestStreak: 5,
			streakDate: new Date('2026-01-03T00:00:00Z'),
		});
	});

	test('updates longestStreak when a new streak surpasses it', () => {
		const streak: StreakState = {
			currentStreak: 5,
			longestStreak: 5,
			streakDate: new Date('2026-01-01T00:00:00Z'),
		};
		const result = computeStreakUpdate(
			streak,
			new Date('2026-01-02T00:00:00Z'),
		);
		expect(result.longestStreak).toBe(6);
	});
});
