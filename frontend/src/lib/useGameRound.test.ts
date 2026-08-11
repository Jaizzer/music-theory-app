import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameRound } from './useGameRound.ts';

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

function setup() {
	let questionNumber = 0;
	const generateQuestion = () => ({ id: questionNumber++ });
	return renderHook(() => useGameRound('MODE_DRILL', generateQuestion));
}

describe('useGameRound', () => {
	test('starts in the playing phase with zeroed stats', () => {
		const { result } = setup();
		expect(result.current.phase).toBe('playing');
		expect(result.current.score).toBe(0);
		expect(result.current.streak).toBe(0);
		expect(result.current.questionsAnswered).toBe(0);
	});

	test('a correct answer scores, then advances to a new question', () => {
		const { result } = setup();
		const firstQuestion = result.current.question;

		act(() => {
			result.current.answerCorrect();
		});
		expect(result.current.phase).toBe('correct');
		expect(result.current.score).toBe(10);
		expect(result.current.streak).toBe(1);

		act(() => {
			vi.advanceTimersByTime(600);
		});
		expect(result.current.phase).toBe('playing');
		expect(result.current.questionsAnswered).toBe(1);
		expect(result.current.question).not.toBe(firstQuestion);
	});

	test('an incorrect answer resets streak and calls onRetry after the delay', () => {
		const { result } = setup();
		act(() => {
			result.current.answerCorrect();
		});
		act(() => {
			vi.advanceTimersByTime(600);
		});
		expect(result.current.streak).toBe(1);

		const onRetry = vi.fn();
		act(() => {
			result.current.answerIncorrect(onRetry);
		});
		expect(result.current.phase).toBe('incorrect');
		expect(result.current.streak).toBe(0);
		expect(onRetry).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(800);
		});
		expect(onRetry).toHaveBeenCalledTimes(1);
		expect(result.current.phase).toBe('playing');
	});

	test('reaching the round length completes the round and submits the attempt', () => {
		const { result } = setup();
		for (let i = 0; i < 10; i++) {
			act(() => {
				result.current.answerCorrect();
			});
			act(() => {
				vi.advanceTimersByTime(600);
			});
		}
		expect(result.current.phase).toBe('complete');
		expect(result.current.score).toBe(100);
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
		const scoreAfterFirst = result.current.score;

		// Still in the 'correct' phase (advance delay hasn't elapsed) — a
		// second answerCorrect() here should be a no-op, not double-score.
		act(() => {
			result.current.answerCorrect();
		});
		expect(result.current.score).toBe(scoreAfterFirst);
	});
});
