import { Router } from 'express';
import {
	postFriendRequest,
	patchFriendRequest,
	getFriends,
} from './friends.handler.ts';
import requireAuth from '../../../middleware/authorization.ts';

const router = Router();

router.get('/', requireAuth, getFriends);
router.post('/', requireAuth, postFriendRequest);
router.patch('/:id', requireAuth, patchFriendRequest);

export default router;
