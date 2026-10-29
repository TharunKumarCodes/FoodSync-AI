import { Router } from 'express';
import {
  getAvailableTasks,
  claimTask,
  getMyAssignments,
  markPickedUp,
  markDelivered,
} from './assignmentController';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.VOLUNTEER, UserRole.ADMIN));

router.get('/tasks', getAvailableTasks);
router.get('/mine', getMyAssignments);
router.post('/claim/:id', claimTask);
router.post('/:id/pickup', markPickedUp);
router.post('/:id/deliver', markDelivered);

export default router;
