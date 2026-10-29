import { Router } from 'express';
import {
  createRequest,
  getMyRequests,
  getProviderRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
} from './requestController';
import { requireAuth, requireRole, requireVerifiedRecipient } from '../../middleware/auth';
import { UserRole } from '../../config';

const router = Router();

router.use(requireAuth);

router.get('/mine', requireRole(UserRole.RECIPIENT, UserRole.ADMIN), getMyRequests);
router.get('/provider', requireRole(UserRole.PROVIDER, UserRole.ADMIN), getProviderRequests);

router.post('/listings/:id/requests', requireVerifiedRecipient, createRequest);
router.post('/:id/accept', requireRole(UserRole.PROVIDER, UserRole.ADMIN), acceptRequest);
router.post('/:id/reject', requireRole(UserRole.PROVIDER, UserRole.ADMIN), rejectRequest);
router.post('/:id/cancel', requireRole(UserRole.RECIPIENT, UserRole.ADMIN), cancelRequest);

export default router;
