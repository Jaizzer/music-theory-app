import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameRound, type GameSlug } from './useGameRound.ts';

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({}),
		}),
	);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function setup(gameSlug: GameSlug = 'MODE_DRILL') {
	let questionNumber = 0;
	const generateQuestion = () => ({ id: questionNumber++ });
	return renderHook(() => useGameRound(gameSlug, generateQuestion));
}

describe('useGameRound', () => {
	test('starts in the playing phase with zeroed stats', () => {
		const { result } = setup();
		expect(result.current.phase).toBe('playing');
		expect(result.current.points).toBe(0);
		expect(result.current.combo).toBe(0);
		expect(result.current.questionsAnswered).toBe(0);
	});

	test('a correct answer scores weight * combo, then advances to a new question', () => {
		const { result } = setup('MODE_DRILL');
		const firstQuestion = result.current.question;

		act(() => {
			result.current.answerCorrect();
		});
		expect(result.current.phase).toBe('correct');
		// Mode Drill weight (3) * combo (1).
		expect(result.current.points).toBe(3);
		expect(result.current.combo).toBe(1);

		act(() => {
			vi.advanceTimersByTime(600);
		});
		expect(result.current.phase).toBe('playing');
		expect(result.current.questionsAnswered).toBe(1);
		expect(result.current.question).not.toBe(firstQuestion);
	});

	test('a longer combo is worth more per answer than the first hit', () => {
		const { result } = setup('MODE_DRILL');

		for (let i = 0; i < 3; i++) {
			act(() => {
				result.current.answerCorrect();
			});
			act(() => {
				vi.advanceTimersByTime(600);
			});
		}
		// weight 3 * (1 + 2 + 3) = 18.
		expect(result.current.points).toBe(18);
		expect(result.current.combo).toBe(3);
	});

	test('the same combo is worth more in a higher-weighted game', () => {
		const modeDrill = setup('MODE_DRILL');
		const fretboard = setup('FRETBOARD_IDENTIFIER');

		act(() => {
			modeDrill.result.current.answerCorrect();
			fretboard.result.current.answerCorrect();
		});

		expect(modeDrill.result.current.points).toBe(3);
		expect(fretboard.result.current.points).toBe(1);
		expect(modeDrill.result.current.points).toBeGreaterThan(
			fretboard.result.current.points,
		);
	});

	test('an incorrect answer resets the combo and docks points instead of zeroing them', () => {
		const { result } = setup('MODE_DRILL');
		for (let i = 0; i < 3; i++) {
			act(() => {
				result.current.answerCorrect();
			});
			act(() => {
				vi.advanceTimersByTime(600);
			});
		}
		expect(result.current.points).toBe(18);

		const onRetry = vi.fn();
		act(() => {
			result.current.answerIncorrect(onRetry);
		});
		expect(result.current.phase).toBe('incorrect');
		expect(result.current.combo).toBe(0);
		// Docked by the flat penalty (5), not reset to 0.
		expect(result.current.points).toBe(13);
		expect(onRetry).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(800);
		});
		expect(onRetry).toHaveBeenCalledTimes(1);
		expect(result.current.phase).toBe('playing');
	});

	test('points never go negative even with no points banked yet', () => {
		const { result } = setup();
		act(() => {
			result.current.answerIncorrect();
		});
		expect(result.current.points).toBe(0);
	});

	test('reaching the round length completes the round and submits the attempt', () => {
		const { result } = setup('MODE_DRILL');
		for (let i = 0; i < 10; i++) {
			act(() => {
				result.current.answerCorrect();
			});
			act(() => {
				vi.advanceTimersByTime(600);
			});
		}
		expect(result.current.phase).toBe('complete');
		// weight 3 * (1 + 2 + ... + 10) = 3 * 55 = 165.
		expect(result.current.points).toBe(165);
		expect(result.current.correctCount).toBe(10);
		expect(fetch).toHaveBeenCalledWith(
			'/api/v1/game-attempts',
			expect.objectContaining({ method: 'POST' }),
		);
	});

	test('ignores answers while not in the playing phase', () => {
		const { result } = setup();
		act(() => {
			result.current.answerCorrect();
		});
		const pointsAfterFirst = result.current.points;

		// Still in the 'correct' phase (advance delay hasn't elapsed) — a
		// second answerCorrect() here should be a no-op, not double-score.
		act(() => {
			result.current.answerCorrect();
		});
		expect(result.current.points).toBe(pointsAfterFirst);
	});
});
