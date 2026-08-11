import { Router } from 'express';
import { postGameAttempt } from './game-attempts.handler.ts';
import requireAuth from '../../../middleware/authorization.ts';

const router = Router();

router.post('/', requireAuth, postGameAttempt);

export default router;
