// The composition point: this is the one place StreakBadge, Leaderboard,
// and links to both games appear together. None of those features know
// about each other or about this page — they're composed here, per the
// shared -> features -> app rule the backend already follows.
import { Link } from 'react-router';
import StreakBadge from '../features/streaks/StreakBadge.tsx';
import Leaderboard from '../features/leaderboard/Leaderboard.tsx';

export default function HubPage() {
	return (
		<div className='space-y-6 py-6'>
			<StreakBadge />

			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
				<Link
					to='/games/mode-drill'
					className='rounded border p-4 hover:bg-slate-50'
				>
					<h2 className='font-bold'>Mode Drill</h2>
					<p className='text-sm text-slate-500'>
						Name the root note and mode for a given parent scale +
						degree.
					</p>
				</Link>
				<Link
					to='/games/fretboard-identifier'
					className='rounded border p-4 hover:bg-slate-50'
				>
					<h2 className='font-bold'>Fretboard Identifier</h2>
					<p className='text-sm text-slate-500'>
						Name the note at a highlighted position on the
						fretboard.
					</p>
				</Link>
			</div>

			<div>
				<div className='mb-2 flex items-center justify-between'>
					<h2 className='font-bold'>Leaderboard</h2>
					<Link to='/friends' className='text-sm underline'>
						Manage friends
					</Link>
				</div>
				<Leaderboard />
			</div>
		</div>
	);
}
