// The phase/score/streak/timer state machine shared by every game
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
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from './api.ts';

export type GamePhase = 'playing' | 'correct' | 'incorrect' | 'complete';
export type GameSlug = 'MODE_DRILL' | 'FRETBOARD_IDENTIFIER' | 'SCALE_DEGREE';

const ROUND_LENGTH = 10;
const ADVANCE_DELAY_MS = 600;
const RETRY_DELAY_MS = 800;

export interface GameRoundStatus {
	phase: GamePhase;
	score: number;
	streak: number;
	questionsAnswered: number;
	correctCount: number;
	roundLength: number;
	submitError: string | null;
}

export interface GameRound<Question> extends GameRoundStatus {
	question: Question;
	answerCorrect: () => void;
	answerIncorrect: (onRetry?: () => void) => void;
}

export function useGameRound<Question>(
	gameSlug: GameSlug,
	generateQuestion: () => Question,
): GameRound<Question> {
	const [question, setQuestion] = useState<Question>(generateQuestion);
	const [phase, setPhase] = useState<GamePhase>('playing');
	const [score, setScore] = useState(0);
	const [streak, setStreak] = useState(0);
	const [questionsAnswered, setQuestionsAnswered] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
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

	function answerCorrect() {
		if (phase !== 'playing') {
			return;
		}
		setPhase('correct');
		setScore((current) => current + 10);
		setStreak((current) => current + 1);
		setCorrectCount((current) => current + 1);
	}

	function answerIncorrect(onRetry?: () => void) {
		if (phase !== 'playing') {
			return;
		}
		retryCallbackRef.current = onRetry ?? null;
		setPhase('incorrect');
		setStreak(0);
	}

	// The only two things that actually need an effect: real timers. Every
	// setState call below happens inside a setTimeout callback (an async
	// boundary), never synchronously in the effect body.
	useEffect(() => {
		if (phase === 'correct') {
			const timeout = setTimeout(() => {
				setQuestionsAnswered((previous) => {
					const next = previous + 1;
					if (next >= ROUND_LENGTH) {
						setPhase('complete');
					} else {
						setQuestion(generateQuestionRef.current());
						setPhase('playing');
					}
					return next;
				});
			}, ADVANCE_DELAY_MS);
			return () => {
				clearTimeout(timeout);
			};
		}

		if (phase === 'incorrect') {
			const timeout = setTimeout(() => {
				retryCallbackRef.current?.();
				setPhase('playing');
			}, RETRY_DELAY_MS);
			return () => {
				clearTimeout(timeout);
			};
		}
	}, [phase]);

	// Reports the finished round to the backend — the one point any game
	// talks to the server; every question in between is pure client state.
	useEffect(() => {
		if (phase !== 'complete') {
			return;
		}
		const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
		apiFetch('/api/v1/game-attempts', {
			method: 'POST',
			body: JSON.stringify({
				game: gameSlug,
				score,
				correctCount,
				totalCount: ROUND_LENGTH,
				durationSeconds,
			}),
		}).catch(() => {
			setSubmitError("Couldn't save this round, but here's how you did:");
		});
	}, [phase, gameSlug, startedAt, score, correctCount]);

	return {
		question,
		phase,
		score,
		streak,
		questionsAnswered,
		correctCount,
		roundLength: ROUND_LENGTH,
		submitError,
		answerCorrect,
		answerIncorrect,
	};
}
