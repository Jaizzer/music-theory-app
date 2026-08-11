import { Router } from 'express';
import { getLeaderboardHandler } from './leaderboard.handler.ts';
import requireAuth from '../../../middleware/authorization.ts';

const router = Router();

// ?scope=global (default) | friends
router.get('/', requireAuth, getLeaderboardHandler);

export default router;
