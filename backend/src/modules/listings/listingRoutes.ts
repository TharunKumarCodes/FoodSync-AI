import { Router } from 'express';
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  cancelListing,
} from './listingController';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config';

const router = Router();

router.get('/', getListings);
router.get('/:id', getListingById);

// Protected actions for Providers and Admins
router.post('/', requireAuth, requireRole(UserRole.PROVIDER, UserRole.ADMIN), createListing);
router.patch('/:id', requireAuth, requireRole(UserRole.PROVIDER, UserRole.ADMIN), updateListing);
router.post('/:id/cancel', requireAuth, requireRole(UserRole.PROVIDER, UserRole.ADMIN), cancelListing);

export default router;
