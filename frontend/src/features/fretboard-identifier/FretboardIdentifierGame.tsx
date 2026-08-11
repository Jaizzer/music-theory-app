// Renders a virtual fretboard with one highlighted position (the "orb")
// and a 12-note answer grid — identify the note at that position. Single-
// part answer (unlike mode-drill's note+mode pair), so the check/retry
// logic is simpler: no partial credit to preserve, just right or wrong.
// Same reasoning as ModeDrillGame for where logic lives: answer-checking
// happens in the click handler (a direct response to a user event), and
// effects are reserved for real timers and the network call.
import { useEffect, useState } from 'react';
import {
	CHROMATIC_NOTES,
	OPEN_STRING_NOTES,
	FRET_COUNT,
	getNoteAtPosition,
	generateQuestion,
	type FretboardQuestion,
} from './fretboardLogic.ts';
import { apiFetch } from '../../lib/api.ts';

const ROUND_LENGTH = 10;
const ADVANCE_DELAY_MS = 600;
const RETRY_DELAY_MS = 800;
const SINGLE_DOT_FRETS = new Set([3, 5, 7, 9]);
const DOUBLE_DOT_FRET = 12;

type Phase = 'playing' | 'correct' | 'incorrect' | 'complete';

export default function FretboardIdentifierGame() {
	const [question, setQuestion] = useState<FretboardQuestion>(() =>
		generateQuestion(),
	);
	const [selectedNote, setSelectedNote] = useState<string | null>(null);
	const [phase, setPhase] = useState<Phase>('playing');
	const [score, setScore] = useState(0);
	const [streak, setStreak] = useState(0);
	const [questionsAnswered, setQuestionsAnswered] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [startedAt] = useState(() => Date.now());
	const [submitError, setSubmitError] = useState<string | null>(null);

	function handleSelectNote(note: string) {
		if (phase !== 'playing') {
			return;
		}
		setSelectedNote(note);

		const answer = getNoteAtPosition(question.stringIndex, question.fret);
		if (note === answer) {
			setPhase('correct');
			setScore((current) => current + 10);
			setStreak((current) => current + 1);
			setCorrectCount((current) => current + 1);
		} else {
			setPhase('incorrect');
			setStreak(0);
		}
	}

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
					setPhase('playing');
				}
			}, ADVANCE_DELAY_MS);
			return () => {
				clearTimeout(timeout);
			};
		}

		if (phase === 'incorrect') {
			const timeout = setTimeout(() => {
				setSelectedNote(null);
				setPhase('playing');
			}, RETRY_DELAY_MS);
			return () => {
				clearTimeout(timeout);
			};
		}
	}, [phase, questionsAnswered]);

	useEffect(() => {
		if (phase !== 'complete') {
			return;
		}
		const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
		apiFetch('/api/v1/game-attempts', {
			method: 'POST',
			body: JSON.stringify({
				game: 'FRETBOARD_IDENTIFIER',
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

	const frets = Array.from({ length: FRET_COUNT + 1 }, (_, fret) => fret);

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

			<p className='text-center text-lg'>What note is highlighted?</p>

			<div className='overflow-x-auto'>
				<div className='inline-block min-w-full'>
					{OPEN_STRING_NOTES.map((_, stringIndex) => (
						<div
							key={stringIndex}
							className='flex border-b last:border-b-0'
						>
							{frets.map((fret) => {
								const isTarget =
									stringIndex === question.stringIndex &&
									fret === question.fret;
								return (
									<div
										key={fret}
										className='flex h-8 w-8 flex-none items-center justify-center border-r text-xs text-slate-300'
									>
										{isTarget && (
											<span className='h-5 w-5 rounded-full bg-amber-500' />
										)}
										{!isTarget &&
											stringIndex ===
												OPEN_STRING_NOTES.length - 1 &&
											(SINGLE_DOT_FRETS.has(fret) ||
												fret === DOUBLE_DOT_FRET) &&
											'•'}
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>

			<div className='grid grid-cols-6 gap-1'>
				{CHROMATIC_NOTES.map((note) => (
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
		</div>
	);
}
