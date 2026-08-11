// Note there's no POST here for creating a user — that's
// POST /api/v1/authentication/sign-up/email, handled entirely by Better
// Auth (see src/lib/auth.ts). This router only owns the parts of "users"
// that aren't authentication: reading and editing an existing profile.
import { Router } from 'express';
import { getUser, updateUser } from './users.handler.ts';
import requireAuth from '../../../middleware/authorization.ts';

const router = Router();

router.get('/:id', requireAuth, getUser);
router.put('/:id', requireAuth, updateUser);

export default router;
