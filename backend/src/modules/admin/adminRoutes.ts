import { Router } from 'express';
import {
  getAdminOverview,
  getPendingOrganizations,
  approveOrganization,
  rejectOrganization,
  getAllUsers,
  updateUserStatus,
  getAuditLogs,
  exportAuditLogsCsv,
} from './adminController';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.ADMIN));

router.get('/overview', getAdminOverview);
router.get('/organizations/pending', getPendingOrganizations);
router.post('/organizations/:id/approve', approveOrganization);
router.post('/organizations/:id/reject', rejectOrganization);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/audit-logs', getAuditLogs);
router.get('/export/audit-logs', exportAuditLogsCsv);

export default router;
