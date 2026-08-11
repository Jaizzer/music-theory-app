import type { Request, Response } from 'express';
import {
	getLeaderboard,
	type LeaderboardScope,
} from './leaderboard.service.ts';

function parseScope(value: unknown): LeaderboardScope {
	return value === 'friends' ? 'friends' : 'global';
}

export async function getLeaderboardHandler(req: Request, res: Response) {
	if (!req.user) {
		res.status(401).json({ message: 'Not signed in.' });
		return;
	}

	const scope = parseScope(req.query.scope);
	const leaderboard = await getLeaderboard(req.user.id, scope);
	res.status(200).json({ leaderboard, scope });
}
