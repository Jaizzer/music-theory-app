import { Router } from 'express';
import { getMyStreak } from './streaks.handler.ts';
import requireAuth from '../../../middleware/authorization.ts';

const router = Router();

router.get('/me', requireAuth, getMyStreak);

export default router;
