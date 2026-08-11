import { Router } from 'express';
import { getMyLeaderboard } from './leaderboard.handler.ts';
import requireAuth from '../../../middleware/authorization.ts';

const router = Router();

router.get('/me', requireAuth, getMyLeaderboard);

export default router;
