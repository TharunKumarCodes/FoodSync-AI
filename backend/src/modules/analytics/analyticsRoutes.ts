import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { ListingStatus, RequestStatus } from '../../config';

const router = Router();

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      activeListingsCount,
      pendingRequestsCount,
      completedDonationsCount,
      activeVolunteersCount,
      totalListingsCount,
      allListings,
      completedRequests,
    ] = await Promise.all([
      prisma.foodListing.count({ where: { status: ListingStatus.AVAILABLE } }),
      prisma.donationRequest.count({ where: { status: RequestStatus.PENDING } }),
      prisma.donationRequest.count({ where: { status: RequestStatus.COMPLETED } }),
      prisma.user.count({ where: { role: 'VOLUNTEER', accountStatus: 'ACTIVE' } }),
      prisma.foodListing.count(),
      prisma.foodListing.findMany({
        select: { category: true, status: true, quantity: true, unit: true },
      }),
      prisma.donationRequest.findMany({
        where: { status: RequestStatus.COMPLETED },
        select: { acceptedQuantity: true, requestedQuantity: true },
      }),
    ]);

    // Calculate portions rescued from real database records
    let totalPortionsRescued = 0;
    for (const req of completedRequests) {
      totalPortionsRescued += req.acceptedQuantity || req.requestedQuantity || 0;
    }

    // Breakdown by category
    const categoryCounts: Record<string, number> = {};
    for (const listing of allListings) {
      categoryCounts[listing.category] = (categoryCounts[listing.category] || 0) + 1;
    }

    // Breakdown by status
    const statusCounts: Record<string, number> = {};
    for (const listing of allListings) {
      statusCounts[listing.status] = (statusCounts[listing.status] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        isDemoData: true,
        notice: 'Real aggregate database metrics. Figures reflect seeded demo and user-created data.',
        metrics: {
          activeListings: activeListingsCount,
          pendingRequests: pendingRequestsCount,
          completedDonations: completedDonationsCount,
          activeVolunteers: activeVolunteersCount,
          totalListings: totalListingsCount,
          totalUnitsRescued: Math.round(totalPortionsRescued * 10) / 10,
        },
        categoryBreakdown: categoryCounts,
        statusBreakdown: statusCounts,
        educationalEstimates: {
          disclaimer: 'Educational estimates based on average standard food recovery assumptions (~0.5 kg CO2e avoided per rescued meal portion).',
          estimatedKgCO2eAvoided: Math.round(totalPortionsRescued * 0.5 * 10) / 10,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
