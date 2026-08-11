import { z } from 'zod';
import { GameSlug } from '../database/generated/enums.ts';

// Sign-up/sign-in request bodies are validated internally by Better Auth
// (see src/lib/auth.ts) — this file only validates bodies for our own
// custom routes, i.e. the profile-update endpoint below.
export const UpdateUserSchema = z.object({
	name: z.string().min(1).max(100),
});

export const CreateGameAttemptSchema = z.object({
	game: z.enum(GameSlug),
	score: z.number().int().nonnegative(),
	correctCount: z.number().int().nonnegative(),
	totalCount: z.number().int().positive(),
	durationSeconds: z.number().int().nonnegative(),
});
