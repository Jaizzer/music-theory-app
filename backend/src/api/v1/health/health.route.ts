import { Router } from 'express';
import { getHealth } from './health.handler.ts';

const router = Router();

// Unauthenticated on purpose — uptime monitors and Vercel's own health
// checks need to reach this without a session.
router.get('/', getHealth);

export default router;
