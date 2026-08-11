import type { ReactNode } from 'react';
import type { GameRoundStatus } from '../lib/useGameRound.ts';
import Card from './Card.tsx';
import RoundComplete from './RoundComplete.tsx';

// The panel every game plays inside: a header (question progress, points,
// combo) plus a border+shadow "pulse" on correct/incorrect — ../mode's
// `.panel-correct`/`.panel-error` treatment (a colored glow, not just a
// border-color swap) applied generically via `status.phase`, so all three
// games get it automatically instead of each re-implementing the glow.
// Swaps to RoundComplete once the round is over, so no game needs its own
// "if complete, show the summary" branch.
const GLOW_CLASSES: Record<GameRoundStatus['phase'], string> = {
	playing: 'border-border',
	correct: 'border-success shadow-[0_0_30px_rgba(34,197,94,0.35)]',
	incorrect: 'border-error shadow-[0_0_30px_rgba(239,68,68,0.35)]',
	complete: 'border-border',
};

function formatTime(ms: number): string {
	const totalSeconds = Math.ceil(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

interface GameShellProps {
	status: GameRoundStatus;
	children: ReactNode;
}

export default function GameShell({ status, children }: GameShellProps) {
	if (status.phase === 'complete') {
		return (
			<RoundComplete
				points={status.points}
				correctCount={status.correctCount}
				totalCount={status.totalCount}
				submitError={status.submitError}
			/>
		);
	}

	return (
		<Card
			className={`space-y-4 border-2 p-4 transition-shadow duration-300 ${GLOW_CLASSES[status.phase]}`}
		>
			<div className='flex justify-between text-sm text-text-muted'>
				<span>
					Time:{' '}
					<span className='text-text'>
						{formatTime(status.timeRemainingMs)}
					</span>
				</span>
				<span>
					Points: <span className='text-text'>{status.points}</span> ·
					Combo: <span className='text-text'>{status.combo}</span>
				</span>
			</div>
			{children}
		</Card>
	);
}
