// The composition point: this is the one place StreakBadge, Leaderboard,
// and links to all three games appear together. None of those features
// know about each other or about this page — they're composed here, per
// the shared -> features -> app rule the backend already follows.
import { Link } from 'react-router';
import StreakBadge from '../features/streaks/StreakBadge.tsx';
import Leaderboard from '../features/leaderboard/Leaderboard.tsx';
import Badge from '../components/Badge.tsx';
import { GAME_WEIGHTS, type GameSlug } from '../lib/useGameRound.ts';

interface GameCard {
	to: string;
	title: string;
	description: string;
	game: GameSlug;
}

const GAMES: GameCard[] = [
	{
		to: '/games/mode-drill',
		title: 'Mode Drill',
		description:
			'Name the root note and mode for a given parent scale + degree.',
		game: 'MODE_DRILL',
	},
	{
		to: '/games/fretboard-identifier',
		title: 'Fretboard Identifier',
		description:
			'Name the note at a highlighted position on the fretboard.',
		game: 'FRETBOARD_IDENTIFIER',
	},
	{
		to: '/games/scale-degree',
		title: 'Scale Degree',
		description:
			'Given a root and a target position, name the interval between them.',
		game: 'SCALE_DEGREE',
	},
];

export default function HubPage() {
	return (
		<div className='space-y-8 py-6'>
			<StreakBadge />

			<div>
				<h2 className='mb-3 text-sm font-bold tracking-wide text-text-muted uppercase'>
					Games
				</h2>
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
					{GAMES.map((game) => (
						<Link
							key={game.to}
							to={game.to}
							className='rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent hover:bg-surface-hover'
						>
							<div className='flex items-center justify-between'>
								<h3 className='font-bold text-text'>
									{game.title}
								</h3>
								<Badge tone='accent'>
									{GAME_WEIGHTS[game.game]}× points
								</Badge>
							</div>
							<p className='mt-1 text-sm text-text-muted'>
								{game.description}
							</p>
						</Link>
					))}
				</div>
			</div>

			<div className='space-y-2'>
				<div className='flex justify-end'>
					<Link
						to='/friends'
						className='text-sm text-accent hover:underline'
					>
						Manage friends
					</Link>
				</div>
				<Leaderboard />
			</div>
		</div>
	);
}
