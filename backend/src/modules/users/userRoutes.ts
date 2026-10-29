import { Router } from 'express';
import { getProfile, updateProfile } from './userController';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/me', getProfile);
router.patch('/me', updateProfile);

export default router;
