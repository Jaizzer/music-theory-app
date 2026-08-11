import { Router } from 'express';
import { postGameAttempt, patchGameAttempt } from './game-attempts.handler.ts';
import requireAuth from '../../../middleware/authorization.ts';

const router = Router();

router.post('/', requireAuth, postGameAttempt);
router.patch('/:id', requireAuth, patchGameAttempt);

export default router;
