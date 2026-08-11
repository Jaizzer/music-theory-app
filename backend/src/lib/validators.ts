import { z } from 'zod';
import { GameSlug, FriendshipStatus } from '../database/generated/enums.ts';

// Sign-up/sign-in request bodies are validated internally by Better Auth
// (see src/lib/auth.ts) — this file only validates bodies for our own
// custom routes, i.e. the profile-update endpoint below.
export const UpdateUserSchema = z.object({
	name: z.string().min(1).max(100),
});

export const CreateGameAttemptSchema = z.object({
	game: z.enum(GameSlug),
	points: z.number().int().nonnegative(),
	correctCount: z.number().int().nonnegative(),
	totalCount: z.number().int().positive(),
	durationSeconds: z.number().int().nonnegative(),
});

export const SendFriendRequestSchema = z.object({
	addresseeEmail: z.email(),
});

// Only these two — a friend request isn't set back to PENDING once
// answered, so that's not a valid transition to accept from a client.
export const RespondToFriendRequestSchema = z.object({
	status: z.enum([FriendshipStatus.ACCEPTED, FriendshipStatus.DECLINED]),
});
