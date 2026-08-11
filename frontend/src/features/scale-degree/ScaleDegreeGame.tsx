// Root (green) and target (red) both shown on the fretboard — identify the
// interval between them as a scale degree. Uses the same shared Fretboard
// renderer as FretboardIdentifierGame, just with two markers instead of
// one, and a 12-degree answer grid instead of a 12-note one.
import { useState } from 'react';
import {
	DEGREES,
	computeDegree,
	generateQuestion,
	type ScaleDegreeQuestion,
	type DegreeName,
} from './scaleDegreeLogic.ts';
import { useGameRound } from '../../lib/useGameRound.ts';
import GameShell from '../../components/GameShell.tsx';
import Fretboard from '../../components/Fretboard.tsx';

export default function ScaleDegreeGame() {
	const round = useGameRound('SCALE_DEGREE', generateQuestion);
	const [selectedDegree, setSelectedDegree] = useState<DegreeName | null>(
		null,
	);
	// See ModeDrillGame for why this resets during render rather than in an
	// effect.
	const [questionForSelection, setQuestionForSelection] =
		useState<ScaleDegreeQuestion>(round.question);
	if (questionForSelection !== round.question) {
		setQuestionForSelection(round.question);
		setSelectedDegree(null);
	}

	function handleSelectDegree(degree: DegreeName) {
		if (round.phase !== 'playing') {
			return;
		}
		setSelectedDegree(degree);
		const answer = computeDegree(round.question);
		if (degree === answer) {
			round.answerCorrect();
		} else {
			round.answerIncorrect(() => {
				setSelectedDegree(null);
			});
		}
	}

	return (
		<GameShell status={round}>
			<p className='text-center text-xs font-bold tracking-widest text-accent uppercase'>
				What interval connects root to target?
			</p>

			<Fretboard
				markers={[
					{
						stringIndex: round.question.rootStringIndex,
						fret: round.question.rootFret,
						label: 'R',
						color: 'root',
					},
					{
						stringIndex: round.question.targetStringIndex,
						fret: round.question.targetFret,
						label: '?',
						color: 'target',
					},
				]}
			/>

			<div className='grid grid-cols-6 gap-2'>
				{DEGREES.map(({ name }) => (
					<button
						key={name}
						type='button'
						disabled={round.phase !== 'playing'}
						onClick={() => {
							handleSelectDegree(name);
						}}
						className={`rounded-lg border py-2 text-sm font-semibold transition-all active:scale-95 ${
							selectedDegree === name
								? 'border-accent bg-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
								: 'border-border bg-white/5 hover:border-accent/50'
						}`}
					>
						{name}
					</button>
				))}
			</div>
		</GameShell>
	);
}
