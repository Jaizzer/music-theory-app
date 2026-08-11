import type { GameRoundStatus } from '../lib/useGameRound.ts';
import Card from './Card.tsx';

// The finished-round summary screen — identical across every game, so
// GameShell renders this instead of the game's own content once
// `status.phase === 'complete'`.
export default function RoundComplete({
	score,
	correctCount,
	roundLength,
	submitError,
}: Pick<
	GameRoundStatus,
	'score' | 'correctCount' | 'roundLength' | 'submitError'
>) {
	return (
		<Card className='space-y-2 p-6 text-center'>
			<h2 className='text-lg font-bold'>Round complete!</h2>
			<p className='text-text-muted'>
				Score: <span className='text-text font-semibold'>{score}</span>{' '}
				({correctCount}/{roundLength} correct)
			</p>
			{submitError && (
				<p className='text-sm text-amber-400'>{submitError}</p>
			)}
		</Card>
	);
}
