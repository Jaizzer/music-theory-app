import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api.ts';
import Card from '../../components/Card.tsx';

interface Streak {
	currentStreak: number;
	longestStreak: number;
}

export default function StreakBadge() {
	const [streak, setStreak] = useState<Streak | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		apiFetch<{ streak: Streak }>('/api/v1/streaks/me')
			.then((body) => {
				setStreak(body.streak);
			})
			.catch((err: unknown) => {
				// Previously swallowed entirely, leaving a blank hub with no sign
				// anything failed. Surfaced now so a broken refresh is visible
				// instead of silently stale.
				setError(
					err instanceof ApiError
						? err.message
						: 'Could not load your streak.',
				);
			});
	}, []);

	if (error) {
		return <p className='text-sm text-error'>{error}</p>;
	}

	if (!streak) {
		return null;
	}

	return (
		<Card className='flex items-center gap-4 p-4'>
			<span className='text-4xl'>🔥</span>
			<div>
				<p className='text-3xl font-bold text-text'>
					{streak.currentStreak}
				</p>
				<p className='text-xs text-text-muted'>
					day streak · best {streak.longestStreak}
				</p>
			</div>
		</Card>
	);
}
