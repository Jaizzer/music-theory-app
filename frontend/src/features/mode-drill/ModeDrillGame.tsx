// The question loop is now just: generate a question, let the player pick
// a note and a mode, auto-check once both are picked. Phase/points/combo/
// timers/submission all live in useGameRound — this file only owns "what
// counts as an answer" for mode-drill specifically, and clears just the
// wrong half of a two-part answer on a miss (the one thing that's
// specific to this game rather than shared with the others).
import { useState } from 'react';
import {
	NOTES,
	MODE_NAMES,
	computeModeAnswer,
	generateQuestion,
	ordinal,
	type ModeQuestion,
} from './modeDrillLogic.ts';
import { useGameRound } from '../../lib/useGameRound.ts';
import GameShell from '../../components/GameShell.tsx';

export default function ModeDrillGame() {
	const round = useGameRound('MODE_DRILL', generateQuestion);
	const [selectedNote, setSelectedNote] = useState<string | null>(null);
	const [selectedMode, setSelectedMode] = useState<string | null>(null);
	// Tracks which question the two selections above belong to. A new
	// question (fresh round, or advancing past a correct answer) means both
	// picks should reset — done during render (React's own recommended
	// "adjusting state when a prop changes" pattern), not an effect: this
	// isn't synchronizing with anything external, it's just resetting local
	// state in response to a value changing.
	const [questionForSelections, setQuestionForSelections] =
		useState<ModeQuestion>(round.question);
	if (questionForSelections !== round.question) {
		setQuestionForSelections(round.question);
		setSelectedNote(null);
		setSelectedMode(null);
	}

	function checkAnswer(note: string | null, modeName: string | null) {
		if (!note || !modeName) {
			return;
		}
		const answer = computeModeAnswer(round.question);
		const noteCorrect = note === answer.note;
		const modeCorrect = modeName === answer.modeName;

		if (noteCorrect && modeCorrect) {
			round.answerCorrect();
		} else {
			round.answerIncorrect(() => {
				if (!noteCorrect) setSelectedNote(null);
				if (!modeCorrect) setSelectedMode(null);
			});
		}
	}

	function handleSelectNote(note: string) {
		if (round.phase !== 'playing') {
			return;
		}
		setSelectedNote(note);
		checkAnswer(note, selectedMode);
	}

	function handleSelectMode(modeName: string) {
		if (round.phase !== 'playing') {
			return;
		}
		setSelectedMode(modeName);
		checkAnswer(selectedNote, modeName);
	}

	return (
		<GameShell status={round}>
			<div className='rounded-lg bg-gradient-to-br from-accent/10 to-purple-500/10 p-4 text-center'>
				<p className='text-xs font-bold tracking-widest text-accent uppercase'>
					{round.question.rootNote} {round.question.parentType} Parent
				</p>
				<p className='mt-1 text-xl font-black'>
					The {ordinal(round.question.degreeIndex)} mode?
				</p>
			</div>

			<div>
				<p className='mb-2 text-xs font-bold tracking-wide text-accent uppercase'>
					1. Select the correct note
				</p>
				<div className='grid grid-cols-6 gap-2'>
					{NOTES.map((note) => (
						<button
							key={note}
							type='button'
							disabled={round.phase !== 'playing'}
							onClick={() => {
								handleSelectNote(note);
							}}
							className={`rounded-lg border py-2 text-sm font-semibold transition-all active:scale-95 ${
								selectedNote === note
									? 'border-accent bg-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
									: 'border-border bg-white/5 hover:border-accent/50'
							}`}
						>
							{note}
						</button>
					))}
				</div>
			</div>

			<div>
				<p className='mb-2 text-xs font-bold tracking-wide text-accent uppercase'>
					2. Select the correct mode
				</p>
				<div className='grid grid-cols-4 gap-2'>
					{MODE_NAMES.map((modeName) => (
						<button
							key={modeName}
							type='button'
							disabled={round.phase !== 'playing'}
							onClick={() => {
								handleSelectMode(modeName);
							}}
							className={`rounded-lg border py-2 text-xs font-semibold transition-all active:scale-95 ${
								selectedMode === modeName
									? 'border-accent bg-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
									: 'border-border bg-white/5 hover:border-accent/50'
							}`}
						>
							{modeName}
						</button>
					))}
				</div>
			</div>
		</GameShell>
	);
}
