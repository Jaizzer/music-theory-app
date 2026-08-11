// A ranking table in the LeetCode/HackerRank mold: rank badges, a
// self-highlighted row, and a Global/Friends scope alongside the existing
// Streak/Points sort. Global is the default — per the product decision,
// this is visible to any signed-in user, not just friends; friends is kept
// as a filter tab rather than removed.
//
// One fetch per scope (each response already carries both ranking metrics
// — see the backend's N+1-avoidance comment on leaderboard.service.ts), so
// switching the Streak/Points tab just re-sorts client-side, while switching
// Global/Friends re-fetches against the new scope.
import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api.ts';
import { useSession } from '../../lib/authClient.ts';
import Card from '../../components/Card.tsx';
import Badge from '../../components/Badge.tsx';

interface LeaderboardEntry {
	userId: string;
	name: string | null;
	currentStreak: number;
	longestStreak: number;
	totalPoints: number;
}

type Scope = 'global' | 'friends';
type SortBy = 'streak' | 'points';

function rankTone(index: number): 'gold' | 'silver' | 'bronze' | 'default' {
	if (index === 0) return 'gold';
	if (index === 1) return 'silver';
	if (index === 2) return 'bronze';
	return 'default';
}

export default function Leaderboard() {
	const { data: session } = useSession();
	const [scope, setScope] = useState<Scope>('global');
	const [sortBy, setSortBy] = useState<SortBy>('streak');
	const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Reset the stale result the moment `scope` changes, during render rather
	// than in the effect below — see ModeDrillGame for why (synchronous
	// setState in an effect body triggers a lint error and an extra render).
	// The actual fetch is a legitimate effect: it subscribes to an external
	// system (the network) and calls setState from its callback.
	const [scopeForFetch, setScopeForFetch] = useState<Scope>(scope);
	if (scopeForFetch !== scope) {
		setScopeForFetch(scope);
		setEntries(null);
		setError(null);
	}

	useEffect(() => {
		apiFetch<{ leaderboard: LeaderboardEntry[] }>(
			`/api/v1/leaderboard?scope=${scope}`,
		)
			.then((body) => {
				setEntries(body.leaderboard);
			})
			.catch((err: unknown) => {
				// Unlike the old version, a failed fetch is surfaced instead of
				// leaving the "Loading…" state up forever with no indication
				// anything went wrong.
				setError(
					err instanceof ApiError
						? err.message
						: 'Could not load the leaderboard.',
				);
			});
	}, [scope]);

	const sorted = entries
		? [...entries].sort((a, b) =>
				sortBy === 'streak'
					? b.currentStreak - a.currentStreak
					: b.totalPoints - a.totalPoints,
			)
		: null;

	return (
		<Card className='space-y-4 p-4'>
			<div className='flex items-center justify-between'>
				<h2 className='text-sm font-bold tracking-wide text-text uppercase'>
					Leaderboard
				</h2>
				<div className='flex gap-1'>
					{(['global', 'friends'] as const).map((value) => (
						<button
							key={value}
							type='button'
							onClick={() => {
								setScope(value);
							}}
							className={`rounded-md px-2 py-1 text-xs font-semibold capitalize transition-colors ${
								scope === value
									? 'bg-accent/15 text-accent'
									: 'text-text-muted hover:text-text'
							}`}
						>
							{value}
						</button>
					))}
				</div>
			</div>

			<div className='flex gap-1 border-b border-border-muted pb-2 text-xs'>
				{(['streak', 'points'] as const).map((value) => (
					<button
						key={value}
						type='button'
						onClick={() => {
							setSortBy(value);
						}}
						className={`rounded-md px-2 py-1 font-semibold capitalize transition-colors ${
							sortBy === value
								? 'bg-surface-hover text-text'
								: 'text-text-muted hover:text-text'
						}`}
					>
						{value}
					</button>
				))}
			</div>

			{error && <p className='text-sm text-error'>{error}</p>}

			{!error && !sorted && (
				<p className='text-sm text-text-muted'>Loading leaderboard…</p>
			)}

			{!error && sorted && sorted.length === 0 && (
				<p className='text-sm text-text-muted'>
					{scope === 'friends'
						? 'Add some friends to see them here.'
						: 'No one has played yet.'}
				</p>
			)}

			{sorted && sorted.length > 0 && (
				<table className='w-full text-sm'>
					<thead>
						<tr className='text-left text-xs text-text-dim uppercase'>
							<th className='w-12 pb-2 font-semibold'>Rank</th>
							<th className='pb-2 font-semibold'>Player</th>
							<th className='pb-2 text-right font-semibold'>
								{sortBy === 'streak' ? 'Streak' : 'Points'}
							</th>
						</tr>
					</thead>
					<tbody>
						{sorted.map((entry, index) => {
							const isSelf = entry.userId === session?.user.id;
							return (
								<tr
									key={entry.userId}
									className={`border-t border-border-muted ${
										isSelf ? 'bg-accent/10' : ''
									}`}
								>
									<td className='py-2'>
										<Badge tone={rankTone(index)}>
											{index + 1}
										</Badge>
									</td>
									<td className='py-2 font-medium text-text'>
										{entry.name ?? 'Anonymous'}
										{isSelf && (
											<span className='ml-2 text-xs text-text-dim'>
												you
											</span>
										)}
									</td>
									<td className='py-2 text-right font-mono text-text'>
										{sortBy === 'streak'
											? entry.currentStreak
											: entry.totalPoints}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}
		</Card>
	);
}
