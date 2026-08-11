import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api.ts';

interface Streak {
	currentStreak: number;
	longestStreak: number;
}

export default function StreakBadge() {
	const [streak, setStreak] = useState<Streak | null>(null);

	useEffect(() => {
		apiFetch<{ streak: Streak }>('/api/v1/streaks/me')
			.then((body) => {
				setStreak(body.streak);
			})
			.catch(() => {
				// A failed streak fetch shouldn't block the rest of the hub from
				// rendering — this badge just quietly stays empty.
			});
	}, []);

	if (!streak) {
		return null;
	}

	return (
		<div className='rounded border p-3'>
			<p className='text-2xl font-bold'>{streak.currentStreak} 🔥</p>
			<p className='text-xs text-slate-500'>
				day streak · best {streak.longestStreak}
			</p>
		</div>
	);
}
