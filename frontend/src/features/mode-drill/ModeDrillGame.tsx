// The UI/interaction loop, ported from ../mode's vanilla-JS prototype:
// two independent grids (note, mode), auto-checks the instant both are
// picked (no submit button), and on a wrong answer only clears whichever
// part was actually wrong so the correct pick stays "locked in." The
// scoring math (10 points/correct, mode's theory engine) lives in
// modeDrillLogic.ts — this file is purely the question loop and DOM.
//
// Answer-checking happens directly in the button click handlers, not in a
// useEffect watching for both selections — React's guidance (and this
// project's lint rules) treat synchronous setState-in-an-effect as a smell:
// this is a direct response to a user event, not a sync with an external
// system, so it belongs in the event handler. Effects here are reserved for
// what actually needs one: real timers (setTimeout) and the network call.
import { useEffect, useState } from 'react';
import {
	NOTES,
	MODE_NAMES,
	computeModeAnswer,
	generateQuestion,
	ordinal,
	type ModeQuestion,
} from './modeDrillLogic.ts';
import { apiFetch } from '../../lib/api.ts';

const ROUND_LENGTH = 10;
const ADVANCE_DELAY_MS = 600;
const RETRY_DELAY_MS = 800;

type Phase = 'playing' | 'correct' | 'incorrect' | 'complete';

export default function ModeDrillGame() {
	const [question, setQuestion] = useState<ModeQuestion>(() =>
		generateQuestion(),
	);
	const [selectedNote, setSelectedNote] = useState<string | null>(null);
	const [selectedMode, setSelectedMode] = useState<string | null>(null);
	const [phase, setPhase] = useState<Phase>('playing');
	const [score, setScore] = useState(0);
	const [streak, setStreak] = useState(0);
	const [questionsAnswered, setQuestionsAnswered] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [startedAt] = useState(() => Date.now());
	const [submitError, setSubmitError] = useState<string | null>(null);

	function checkAnswer(note: string | null, modeName: string | null) {
		if (!note || !modeName) {
			return;
		}

		const answer = computeModeAnswer(question);
		if (note === answer.note && modeName === answer.modeName) {
			setPhase('correct');
			setScore((current) => current + 10);
			setStreak((current) => current + 1);
			setCorrectCount((current) => current + 1);
		} else {
			setPhase('incorrect');
			setStreak(0);
		}
	}

	function handleSelectNote(note: string) {
		if (phase !== 'playing') {
			return;
		}
		setSelectedNote(note);
		checkAnswer(note, selectedMode);
	}

	function handleSelectMode(modeName: string) {
		if (phase !== 'playing') {
			return;
		}
		setSelectedMode(modeName);
		checkAnswer(selectedNote, modeName);
	}

	// The only things that actually need an effect: real timers (advance to
	// the next question, or clear the wrong part of an answer for retry) —
	// both are "subscribe to an external clock, setState when it fires,"
	// which is exactly what effects are for.
	useEffect(() => {
		if (phase === 'correct') {
			const timeout = setTimeout(() => {
				const nextAnswered = questionsAnswered + 1;
				setQuestionsAnswered(nextAnswered);
				if (nextAnswered >= ROUND_LENGTH) {
					setPhase('complete');
				} else {
					setQuestion(generateQuestion());
					setSelectedNote(null);
					setSelectedMode(null);
					setPhase('playing');
				}
			}, ADVANCE_DELAY_MS);
			return () => {
				clearTimeout(timeout);
			};
		}

		if (phase === 'incorrect') {
			const answer = computeModeAnswer(question);
			const noteWasCorrect = selectedNote === answer.note;
			const modeWasCorrect = selectedMode === answer.modeName;

			const timeout = setTimeout(() => {
				if (!noteWasCorrect) setSelectedNote(null);
				if (!modeWasCorrect) setSelectedMode(null);
				setPhase('playing');
			}, RETRY_DELAY_MS);
			return () => {
				clearTimeout(timeout);
			};
		}
	}, [phase, question, selectedNote, selectedMode, questionsAnswered]);

	// Reports the finished round to the backend — this is the one point
	// where the game talks to the server at all; every question in between
	// is pure client-side state.
	useEffect(() => {
		if (phase !== 'complete') {
			return;
		}
		const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
		apiFetch('/api/v1/game-attempts', {
			method: 'POST',
			body: JSON.stringify({
				game: 'MODE_DRILL',
				score,
				correctCount,
				totalCount: ROUND_LENGTH,
				durationSeconds,
			}),
		}).catch(() => {
			setSubmitError("Couldn't save this round, but here's how you did:");
		});
	}, [phase, startedAt, score, correctCount]);

	if (phase === 'complete') {
		return (
			<div className='space-y-2'>
				<h2 className='text-lg font-bold'>Round complete!</h2>
				<p>
					Score: {score} ({correctCount}/{ROUND_LENGTH} correct)
				</p>
				{submitError && (
					<p className='text-sm text-amber-600'>{submitError}</p>
				)}
			</div>
		);
	}

	const glowClass =
		phase === 'correct'
			? 'border-green-500'
			: phase === 'incorrect'
				? 'border-red-500'
				: 'border-transparent';

	return (
		<div className={`space-y-4 rounded border-2 p-4 ${glowClass}`}>
			<div className='flex justify-between text-sm text-slate-500'>
				<span>
					Question {questionsAnswered + 1}/{ROUND_LENGTH}
				</span>
				<span>
					Score: {score} · Streak: {streak}
				</span>
			</div>

			<p className='text-center text-lg'>
				<strong>
					{question.rootNote} {question.parentType} Parent
				</strong>
				<br />
				The {ordinal(question.degreeIndex)} mode?
			</p>

			<div className='grid grid-cols-6 gap-1'>
				{NOTES.map((note) => (
					<button
						key={note}
						type='button'
						disabled={phase !== 'playing'}
						onClick={() => {
							handleSelectNote(note);
						}}
						className={`rounded border py-2 text-sm ${
							selectedNote === note
								? 'bg-slate-900 text-white'
								: ''
						}`}
					>
						{note}
					</button>
				))}
			</div>

			<div className='grid grid-cols-4 gap-1'>
				{MODE_NAMES.map((modeName) => (
					<button
						key={modeName}
						type='button'
						disabled={phase !== 'playing'}
						onClick={() => {
							handleSelectMode(modeName);
						}}
						className={`rounded border py-2 text-sm ${
							selectedMode === modeName
								? 'bg-slate-900 text-white'
								: ''
						}`}
					>
						{modeName}
					</button>
				))}
			</div>
		</div>
	);
}
