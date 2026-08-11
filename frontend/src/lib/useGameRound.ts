// The phase/points/combo/timer state machine shared by every game
// (ModeDrillGame, FretboardIdentifierGame, ScaleDegreeGame). Previously
// each game duplicated this whole thing; extracted here once a third game
// made "copy-paste it a third time" clearly the wrong move — the same
// promote-to-shared rule already applied on the backend.
//
// Deliberately does NOT know what a "question" or "answer" looks like for
// any specific game — it only tracks phase transitions and reports them.
// Each game supplies its own `generateQuestion` and decides for itself
// whether a selection is correct, then calls `answerCorrect()` /
// `answerIncorrect(onRetry)`. `onRetry` is how a game like ModeDrillGame
// (two-part answer, only the wrong part should clear) differs from a
// single-answer game (the whole selection just clears) — the hook doesn't
// need to know which case it is.
//
// A session runs for a fixed 2 minutes rather than a fixed number of
// questions, and every answer saves to the backend immediately (create
// the attempt on mount, PATCH it after each answer) rather than waiting
// for the session to finish — so a closed tab loses at most the answer
// that was in flight, never the whole session. See
// backend/src/api/v1/game-attempts/game-attempts.service.ts for the other
// half of that.
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from './api.ts';

export type GamePhase = 'playing' | 'correct' | 'incorrect' | 'complete';
export type GameSlug = 'MODE_DRILL' | 'FRETBOARD_IDENTIFIER' | 'SCALE_DEGREE';

const SESSION_DURATION_MS = 120_000;
const ADVANCE_DELAY_MS = 600;
const RETRY_DELAY_MS = 800;
const COUNTDOWN_TICK_MS = 1000;

// Mode Drill is the hardest of the three (two-part answer: note + mode),
// Scale Degree next (two positions to compare), Fretboard Identifier
// easiest (one position, one note) — points scale with difficulty so the
// harder games are worth more per combo. Exported so HubPage can show the
// multiplier on each game card.
export const GAME_WEIGHTS: Record<GameSlug, number> = {
	MODE_DRILL: 3,
	SCALE_DEGREE: 2,
	FRETBOARD_IDENTIFIER: 1,
};

// A wrong answer costs a little rather than wiping points back to zero —
// the combo itself still resets (see answerIncorrect), but the points
// already banked from earlier in the session mostly survive one mistake.
const STREAK_BREAK_PENALTY = 5;

export interface GameRoundStatus {
	phase: GamePhase;
	points: number;
	combo: number;
	correctCount: number;
	totalCount: number;
	timeRemainingMs: number;
	submitError: string | null;
}

export interface GameRound<Question> extends GameRoundStatus {
	question: Question;
	answerCorrect: () => void;
	answerIncorrect: (onRetry?: () => void) => void;
}

interface CreateAttemptResponse {
	attempt: { id: string };
}

export function useGameRound<Question>(
	gameSlug: GameSlug,
	generateQuestion: () => Question,
): GameRound<Question> {
	const [question, setQuestion] = useState<Question>(generateQuestion);
	const [phase, setPhase] = useState<GamePhase>('playing');
	const [points, setPoints] = useState(0);
	const [combo, setCombo] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [timeRemainingMs, setTimeRemainingMs] = useState(SESSION_DURATION_MS);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [startedAt] = useState(() => Date.now());

	// Refs, not state or deps — `generateQuestion` is a fresh closure every
	// render and `onRetry` is supplied per-answer, so putting either in the
	// effect's dependency array would re-run it far more than intended.
	// Always reading the latest value through a ref sidesteps that without
	// needing to ask every caller to memoize a callback.
	const generateQuestionRef = useRef(generateQuestion);
	useEffect(() => {
		generateQuestionRef.current = generateQuestion;
	});
	const retryCallbackRef = useRef<(() => void) | null>(null);

	// Creates the session's GameAttempt row once, on mount. Held as a
	// promise (not just the resolved id): an answer that happens in the
	// brief window before this resolves still awaits the same promise and
	// saves once it's ready, rather than being silently dropped.
	const attemptIdPromiseRef = useRef<Promise<string | null> | null>(null);
	useEffect(() => {
		attemptIdPromiseRef.current = apiFetch<CreateAttemptResponse>(
			'/api/v1/game-attempts',
			{
				method: 'POST',
				body: JSON.stringify({ game: gameSlug }),
			},
		)
			.then((body) => body.attempt.id)
			.catch(() => {
				setSubmitError("Couldn't start saving this session.");
				return null;
			});
	}, [gameSlug]);

	// Sends the full cumulative state (not a delta) to the attempt's row —
	// this is what makes progress durable against a closed tab: whatever
	// the last successful call here was *is* the saved state.
	function save(
		nextPoints: number,
		nextCorrectCount: number,
		nextTotalCount: number,
	) {
		const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
		attemptIdPromiseRef.current
			?.then((id) => {
				if (!id) {
					return undefined;
				}
				return apiFetch(`/api/v1/game-attempts/${id}`, {
					method: 'PATCH',
					body: JSON.stringify({
						points: nextPoints,
						correctCount: nextCorrectCount,
						totalCount: nextTotalCount,
						durationSeconds,
					}),
				});
			})
			.catch(() => {
				setSubmitError("Couldn't save your progress just now.");
			});
	}

	function answerCorrect() {
		if (phase !== 'playing') {
			return;
		}
		// Each correct answer is worth more the longer the combo runs —
		// nextCombo grows the multiplier, GAME_WEIGHTS makes the harder games
		// worth more for the same combo length.
		const nextCombo = combo + 1;
		const nextPoints = points + GAME_WEIGHTS[gameSlug] * nextCombo;
		const nextCorrectCount = correctCount + 1;
		const nextTotalCount = totalCount + 1;
		setPhase('correct');
		setCombo(nextCombo);
		setPoints(nextPoints);
		setCorrectCount(nextCorrectCount);
		setTotalCount(nextTotalCount);
		save(nextPoints, nextCorrectCount, nextTotalCount);
	}

	function answerIncorrect(onRetry?: () => void) {
		if (phase !== 'playing') {
			return;
		}
		retryCallbackRef.current = onRetry ?? null;
		const nextPoints = Math.max(0, points - STREAK_BREAK_PENALTY);
		const nextTotalCount = totalCount + 1;
		setPhase('incorrect');
		setCombo(0);
		setPoints(nextPoints);
		setTotalCount(nextTotalCount);
		save(nextPoints, correctCount, nextTotalCount);
	}

	// Transition-delay effect: advances to a new question after a correct
	// answer, or retries the same one after an incorrect answer — unless
	// the session's deadline has already passed by the time the delay
	// fires, in which case it ends the session instead of handing out
	// another question.
	useEffect(() => {
		if (phase === 'correct') {
			const timeout = setTimeout(() => {
				if (Date.now() - startedAt >= SESSION_DURATION_MS) {
					setPhase('complete');
				} else {
					setQuestion(generateQuestionRef.current());
					setPhase('playing');
				}
			}, ADVANCE_DELAY_MS);
			return () => {
				clearTimeout(timeout);
			};
		}

		if (phase === 'incorrect') {
			const timeout = setTimeout(() => {
				if (Date.now() - startedAt >= SESSION_DURATION_MS) {
					setPhase('complete');
				} else {
					retryCallbackRef.current?.();
					setPhase('playing');
				}
			}, RETRY_DELAY_MS);
			return () => {
				clearTimeout(timeout);
			};
		}
	}, [phase, startedAt]);

	// Ends the session on time even if the player is just sitting idle on
	// the current question — the effect above only reacts to a correct/
	// incorrect *transition*, so this is what covers "never answered the
	// last question at all."
	useEffect(() => {
		if (phase !== 'playing') {
			return;
		}
		// Math.max(0, ...) rather than an early-return on an already-past
		// deadline — setTimeout(fn, 0) still fires asynchronously on the
		// next tick, so this stays inside the "only setState from inside a
		// timeout callback" rule the rest of this hook follows, instead of
		// calling setState synchronously in the effect body.
		const remaining = Math.max(
			0,
			SESSION_DURATION_MS - (Date.now() - startedAt),
		);
		const timeout = setTimeout(() => {
			setPhase('complete');
		}, remaining);
		return () => {
			clearTimeout(timeout);
		};
	}, [phase, startedAt]);

	// Purely cosmetic countdown, ticking once a second — the two effects
	// above are what actually end the session on time; this never gates
	// correctness, only what the timer visually shows, so a throttled or
	// backgrounded tab can't desync correctness from the display.
	useEffect(() => {
		if (phase === 'complete') {
			return;
		}
		const interval = setInterval(() => {
			setTimeRemainingMs(
				Math.max(0, SESSION_DURATION_MS - (Date.now() - startedAt)),
			);
		}, COUNTDOWN_TICK_MS);
		return () => {
			clearInterval(interval);
		};
	}, [phase, startedAt]);

	return {
		question,
		phase,
		points,
		combo,
		correctCount,
		totalCount,
		timeRemainingMs,
		submitError,
		answerCorrect,
		answerIncorrect,
	};
}
