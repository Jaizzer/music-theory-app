// One fetch, two views: GET /leaderboard/me already returns both ranking
// metrics per entry (see the backend's N+1-avoidance comment on
// leaderboard.service.ts), so switching tabs here just re-sorts the same
// data client-side instead of hitting the API again per tab.
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api.ts';

interface LeaderboardEntry {
	userId: string;
	name: string | null;
	currentStreak: number;
	longestStreak: number;
	totalScore: number;
}

type SortBy = 'streak' | 'score';

export default function Leaderboard() {
	const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
	const [sortBy, setSortBy] = useState<SortBy>('streak');

	useEffect(() => {
		apiFetch<{ leaderboard: LeaderboardEntry[] }>('/api/v1/leaderboard/me')
			.then((body) => {
				setEntries(body.leaderboard);
			})
			.catch(() => {
				// Leave entries as null — the "loading" message just persists
				// rather than crashing the rest of the hub.
			});
	}, []);

	if (!entries) {
		return <p className='text-sm text-slate-400'>Loading leaderboard…</p>;
	}

	const sorted = [...entries].sort((a, b) =>
		sortBy === 'streak'
			? b.currentStreak - a.currentStreak
			: b.totalScore - a.totalScore,
	);

	return (
		<div className='space-y-2'>
			<div className='flex gap-2 text-sm'>
				<button
					type='button'
					onClick={() => {
						setSortBy('streak');
					}}
					className={sortBy === 'streak' ? 'font-bold underline' : ''}
				>
					Streak
				</button>
				<button
					type='button'
					onClick={() => {
						setSortBy('score');
					}}
					className={sortBy === 'score' ? 'font-bold underline' : ''}
				>
					Score
				</button>
			</div>

			<ol className='space-y-1'>
				{sorted.map((entry, index) => (
					<li
						key={entry.userId}
						className='flex justify-between text-sm'
					>
						<span>
							{index + 1}. {entry.name ?? 'Anonymous'}
						</span>
						<span>
							{sortBy === 'streak'
								? `${String(entry.currentStreak)} 🔥`
								: entry.totalScore}
						</span>
					</li>
				))}
			</ol>
		</div>
	);
}
