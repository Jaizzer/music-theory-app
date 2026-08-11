import type { Request, Response } from 'express';
import { getLeaderboard } from './leaderboard.service.ts';

export async function getMyLeaderboard(req: Request, res: Response) {
	if (!req.user) {
		res.status(401).json({ message: 'Not signed in.' });
		return;
	}

	const leaderboard = await getLeaderboard(req.user.id);
	res.status(200).json({ leaderboard });
}
