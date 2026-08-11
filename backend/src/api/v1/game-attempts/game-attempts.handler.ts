import type { Request, Response } from 'express';
import {
	CreateGameAttemptSchema,
	UpdateGameAttemptSchema,
} from '../../../lib/validators.ts';
import {
	createGameAttempt,
	updateGameAttempt,
} from './game-attempts.service.ts';

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

	const { attempt, streak } = await createGameAttempt(
		req.user.id,
		parsedBody.data.game,
	);

	res.status(201).json({ attempt, streak });
}

export async function patchGameAttempt(req: Request, res: Response) {
	if (!req.user) {
		res.status(401).json({ message: 'Not signed in.' });
		return;
	}

	// req.params.id is typed string | string[] | undefined by Express —
	// an explicit guard here rather than an assertion, same pattern as
	// friends.handler.ts.
	const attemptId = req.params.id;
	if (typeof attemptId !== 'string') {
		res.status(400).json({ message: 'Invalid attempt id.' });
		return;
	}

	const parsedBody = UpdateGameAttemptSchema.safeParse(req.body);
	if (!parsedBody.success) {
		res.status(400).json({ message: 'Invalid request body.' });
		return;
	}

	const updated = await updateGameAttempt(
		attemptId,
		req.user.id,
		parsedBody.data,
	);
	if (!updated) {
		res.status(404).json({ message: 'Attempt not found.' });
		return;
	}

	res.status(200).json({ status: 'ok' });
}
