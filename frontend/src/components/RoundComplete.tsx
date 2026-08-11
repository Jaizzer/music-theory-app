import type { GameRoundStatus } from '../lib/useGameRound.ts';
import Card from './Card.tsx';

// The finished-session summary screen — identical across every game, so
// GameShell renders this instead of the game's own content once
// `status.phase === 'complete'`.
export default function RoundComplete({
	points,
	correctCount,
	totalCount,
	submitError,
}: Pick<
	GameRoundStatus,
	'points' | 'correctCount' | 'totalCount' | 'submitError'
>) {
	return (
		<Card className='space-y-2 p-6 text-center'>
			<h2 className='text-lg font-bold'>Time's up!</h2>
			<p className='text-text-muted'>
				Points:{' '}
				<span className='text-text font-semibold'>{points}</span> (
				{correctCount} correct of {totalCount} answered)
			</p>
			{submitError && (
				<p className='text-sm text-amber-400'>{submitError}</p>
			)}
		</Card>
	);
}
