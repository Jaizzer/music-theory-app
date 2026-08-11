import type { Request, Response } from 'express';
import {
	SendFriendRequestSchema,
	RespondToFriendRequestSchema,
} from '../../../lib/validators.ts';
import {
	sendFriendRequest,
	respondToFriendRequest,
	listFriends,
	FriendshipError,
} from './friends.service.ts';

export async function postFriendRequest(req: Request, res: Response) {
	if (!req.user) {
		res.status(401).json({ message: 'Not signed in.' });
		return;
	}

	const parsedBody = SendFriendRequestSchema.safeParse(req.body);
	if (!parsedBody.success) {
		res.status(400).json({ message: 'Invalid request body.' });
		return;
	}

	try {
		const friendship = await sendFriendRequest(
			req.user.id,
			parsedBody.data.addresseeEmail,
		);
		res.status(201).json({ friendship });
	} catch (error) {
		if (error instanceof FriendshipError) {
			res.status(400).json({ message: error.message });
			return;
		}
		throw error;
	}
}

export async function patchFriendRequest(req: Request, res: Response) {
	if (!req.user) {
		res.status(401).json({ message: 'Not signed in.' });
		return;
	}

	const parsedBody = RespondToFriendRequestSchema.safeParse(req.body);
	if (!parsedBody.success) {
		res.status(400).json({ message: 'Invalid request body.' });
		return;
	}

	const friendshipId = req.params.id;
	if (typeof friendshipId !== 'string') {
		res.status(400).json({ message: 'Invalid request.' });
		return;
	}

	try {
		const friendship = await respondToFriendRequest(
			friendshipId,
			req.user.id,
			parsedBody.data.status,
		);
		res.status(200).json({ friendship });
	} catch (error) {
		if (error instanceof FriendshipError) {
			res.status(404).json({ message: error.message });
			return;
		}
		throw error;
	}
}

export async function getFriends(req: Request, res: Response) {
	if (!req.user) {
		res.status(401).json({ message: 'Not signed in.' });
		return;
	}

	const result = await listFriends(req.user.id);
	res.status(200).json(result);
}
