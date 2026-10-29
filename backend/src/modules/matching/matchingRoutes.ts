import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { calculateMatchScore } from './matchingService';
import { requireAuth, requireVerifiedRecipient } from '../../middleware/auth';
import { ListingStatus } from '../../config';

const router = Router();

router.get('/recommended', requireAuth, requireVerifiedRecipient, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { userId: req.user!.id },
    });

    if (!org) {
      res.json({ success: true, data: [] });
      return;
    }

    const listings = await prisma.foodListing.findMany({
      where: {
        status: ListingStatus.AVAILABLE,
        remainingQuantity: { gt: 0 },
        expiresAt: { gt: new Date() },
        pickupEndAt: { gt: new Date() },
      },
      include: {
        provider: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    const recommendations = listings
      .map((listing) => {
        const match = calculateMatchScore(listing, org);
        return {
          ...listing,
          match,
        };
      })
      .filter((item) => item.match.isEligible)
      .sort((a, b) => b.match.score - a.match.score);

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
