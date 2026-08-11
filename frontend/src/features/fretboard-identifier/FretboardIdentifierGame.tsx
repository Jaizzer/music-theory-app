// Identify the note at the highlighted position (the "orb"). Fretboard
// rendering itself lives in the shared Fretboard component (also used by
// ScaleDegreeGame) — this file only owns the single-answer check-and-retry
// logic specific to this game.
import { useState } from 'react';
import { generateQuestion, type FretboardQuestion } from './fretboardLogic.ts';
import {
	CHROMATIC_NOTES,
	getNoteAtPosition,
} from '../../lib/fretboardPositions.ts';
import { useGameRound } from '../../lib/useGameRound.ts';
import GameShell from '../../components/GameShell.tsx';
import Fretboard from '../../components/Fretboard.tsx';

export default function FretboardIdentifierGame() {
	const round = useGameRound('FRETBOARD_IDENTIFIER', generateQuestion);
	const [selectedNote, setSelectedNote] = useState<string | null>(null);
	// See ModeDrillGame for why this resets during render rather than in an
	// effect: it's local UI state reacting to a value change, not a sync
	// with anything external.
	const [questionForSelection, setQuestionForSelection] =
		useState<FretboardQuestion>(round.question);
	if (questionForSelection !== round.question) {
		setQuestionForSelection(round.question);
		setSelectedNote(null);
	}

	function handleSelectNote(note: string) {
		if (round.phase !== 'playing') {
			return;
		}
		setSelectedNote(note);
		const answer = getNoteAtPosition(
			round.question.stringIndex,
			round.question.fret,
		);
		if (note === answer) {
			round.answerCorrect();
		} else {
			round.answerIncorrect(() => {
				setSelectedNote(null);
			});
		}
	}

	return (
		<GameShell status={round}>
			<p className='text-center text-xs font-bold tracking-widest text-accent uppercase'>
				What note is highlighted?
			</p>

			<Fretboard
				markers={[
					{
						stringIndex: round.question.stringIndex,
						fret: round.question.fret,
						label: '?',
						color: 'target',
					},
				]}
			/>

			<div className='grid grid-cols-6 gap-2'>
				{CHROMATIC_NOTES.map((note) => (
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
		</GameShell>
	);
}
