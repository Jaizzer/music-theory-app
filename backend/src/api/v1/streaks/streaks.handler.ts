import type { Request, Response } from 'express';
import { getOwnStreak } from './streaks.service.ts';

export async function getMyStreak(req: Request, res: Response) {
	if (!req.user) {
		res.status(401).json({ message: 'Not signed in.' });
		return;
	}

	const streak = await getOwnStreak(req.user.id);
	res.status(200).json({ streak });
}
