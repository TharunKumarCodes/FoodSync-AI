import { Router } from 'express';
import { getMyOrganization, updateMyOrganization, requestVerification } from './orgController';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.RECIPIENT, UserRole.ADMIN));

router.get('/me', getMyOrganization);
router.patch('/me', updateMyOrganization);
router.post('/me/verification-request', requestVerification);

export default router;
