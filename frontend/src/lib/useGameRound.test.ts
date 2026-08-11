import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameRound, type GameSlug } from './useGameRound.ts';

const SESSION_DURATION_MS = 120_000;

type FetchCall = [string, RequestInit?];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.useFakeTimers();
	let nextAttemptId = 0;
	fetchMock = vi.fn((_url: string, options?: RequestInit) => {
		if (options?.method === 'POST') {
			nextAttemptId += 1;
			return Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve({
						attempt: { id: `attempt-${String(nextAttemptId)}` },
					}),
			});
		}
		return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
	});
	vi.stubGlobal('fetch', fetchMock);
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

function patchCalls(): FetchCall[] {
	return (fetchMock.mock.calls as FetchCall[]).filter(
		([, options]) => options?.method === 'PATCH',
	);
}

function lastPatchBody(): {
	points: number;
	correctCount: number;
	totalCount: number;
} {
	const calls = patchCalls();
	const [, options] = calls[calls.length - 1] as FetchCall;
	return JSON.parse(options?.body as string) as {
		points: number;
		correctCount: number;
		totalCount: number;
	};
}

describe('useGameRound', () => {
	test('starts in the playing phase with zeroed stats and a full timer', () => {
		const { result } = setup();
		expect(result.current.phase).toBe('playing');
		expect(result.current.points).toBe(0);
		expect(result.current.combo).toBe(0);
		expect(result.current.totalCount).toBe(0);
		expect(result.current.timeRemainingMs).toBe(SESSION_DURATION_MS);
	});

	test('creates the session once on mount', async () => {
		setup('MODE_DRILL');
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		const postCalls = (fetchMock.mock.calls as FetchCall[]).filter(
			([, options]) => options?.method === 'POST',
		);
		expect(postCalls).toHaveLength(1);
		const [url, options] = postCalls[0] as FetchCall;
		expect(url).toBe('/api/v1/game-attempts');
		expect(JSON.parse(options?.body as string)).toEqual({
			game: 'MODE_DRILL',
		});
	});

	test('a correct answer scores weight * combo and PATCHes the attempt', async () => {
		const { result } = setup('MODE_DRILL');
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		act(() => {
			result.current.answerCorrect();
		});
		expect(result.current.phase).toBe('correct');
		// Mode Drill weight (3) * combo (1).
		expect(result.current.points).toBe(3);
		expect(result.current.combo).toBe(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(lastPatchBody()).toMatchObject({
			points: 3,
			correctCount: 1,
			totalCount: 1,
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(600);
		});
		expect(result.current.phase).toBe('playing');
	});

	test('an answer that happens before creation resolves still saves once it does', async () => {
		let resolveCreate: (() => void) | undefined;
		fetchMock.mockImplementationOnce(() => {
			return new Promise((resolve) => {
				resolveCreate = () => {
					resolve({
						ok: true,
						json: () =>
							Promise.resolve({ attempt: { id: 'attempt-1' } }),
					});
				};
			});
		});

		const { result } = setup('MODE_DRILL');

		// Answer immediately — creation hasn't resolved yet.
		act(() => {
			result.current.answerCorrect();
		});
		expect(patchCalls()).toHaveLength(0);

		// Now let creation resolve.
		await act(async () => {
			resolveCreate?.();
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(patchCalls()).toHaveLength(1);
		expect(lastPatchBody()).toMatchObject({ points: 3, correctCount: 1 });
	});

	test('a longer combo is worth more per answer than the first hit', async () => {
		const { result } = setup('MODE_DRILL');
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		for (let i = 0; i < 3; i++) {
			act(() => {
				result.current.answerCorrect();
			});
			await act(async () => {
				await vi.advanceTimersByTimeAsync(600);
			});
		}
		// weight 3 * (1 + 2 + 3) = 18.
		expect(result.current.points).toBe(18);
		expect(result.current.combo).toBe(3);
	});

	test('the same combo is worth more in a higher-weighted game', async () => {
		const modeDrill = setup('MODE_DRILL');
		const fretboard = setup('FRETBOARD_IDENTIFIER');
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		act(() => {
			modeDrill.result.current.answerCorrect();
			fretboard.result.current.answerCorrect();
		});

		expect(modeDrill.result.current.points).toBe(3);
		expect(fretboard.result.current.points).toBe(1);
	});

	test('an incorrect answer resets the combo and docks points instead of zeroing them', async () => {
		const { result } = setup('MODE_DRILL');
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		for (let i = 0; i < 3; i++) {
			act(() => {
				result.current.answerCorrect();
			});
			await act(async () => {
				await vi.advanceTimersByTimeAsync(600);
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

		await act(async () => {
			await vi.advanceTimersByTimeAsync(800);
		});
		expect(onRetry).toHaveBeenCalledTimes(1);
		expect(result.current.phase).toBe('playing');
	});

	test('points never go negative even with no points banked yet', async () => {
		const { result } = setup();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		act(() => {
			result.current.answerIncorrect();
		});
		expect(result.current.points).toBe(0);
	});

	test('ignores answers while not in the playing phase', async () => {
		const { result } = setup();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
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

	test('the session completes after 2 minutes of sitting idle', async () => {
		const { result } = setup();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(result.current.phase).toBe('playing');

		await act(async () => {
			await vi.advanceTimersByTimeAsync(SESSION_DURATION_MS);
		});
		expect(result.current.phase).toBe('complete');
	});

	test('a correct answer right at the deadline ends the session instead of advancing', async () => {
		const { result } = setup();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		// Get within one advance-delay of the deadline, then answer.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(SESSION_DURATION_MS - 300);
		});
		act(() => {
			result.current.answerCorrect();
		});
		expect(result.current.phase).toBe('correct');

		// The 600ms advance delay pushes past the deadline.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(600);
		});
		expect(result.current.phase).toBe('complete');
	});

	test('the countdown ticks down once a second', async () => {
		const { result } = setup();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		expect(result.current.timeRemainingMs).toBe(SESSION_DURATION_MS - 3000);
	});
});
