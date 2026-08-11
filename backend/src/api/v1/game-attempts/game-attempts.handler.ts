import type { Request, Response } from 'express';
import { CreateGameAttemptSchema } from '../../../lib/validators.ts';
import { createGameAttempt } from './game-attempts.service.ts';

export async function postGameAttempt(req: Request, res: Response) {
	if (!req.user) {
		res.status(401).json({ message: 'Not signed in.' });
		return;
	}

	const parsedBody = CreateGameAttemptSchema.safeParse(req.body);
	if (!parsedBody.success) {
		res.status(400).json({ message: 'Invalid request body.' });
		return;
	}

	const { attempt, streak } = await createGameAttempt({
		userId: req.user.id,
		...parsedBody.data,
	});

	res.status(201).json({ attempt, streak });
}
