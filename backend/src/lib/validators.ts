import { z } from 'zod';

// Sign-up/sign-in request bodies are validated internally by Better Auth
// (see src/lib/auth.ts) — this file only validates bodies for our own
// custom routes, i.e. the profile-update endpoint below.
export const UpdateUserSchema = z.object({
	name: z.string().min(1).max(100),
});
