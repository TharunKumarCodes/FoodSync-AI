import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/audit';
import { ListingStatus, UserRole } from '../../config';
import { calculateMatchScore } from '../matching/matchingService';
import { isValidListingTransition } from '../../utils/lifecycle';

const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit: z.string().min(1, 'Unit is required (e.g., portions, meals, kg)'),
  preparedAt: z.string().optional().nullable(),
  expiresAt: z.string().refine(val => new Date(val).getTime() > Date.now(), {
    message: 'Expiry time must be in the future',
  }),
  pickupStartAt: z.string(),
  pickupEndAt: z.string().refine(val => new Date(val).getTime() > Date.now(), {
    message: 'Pickup end time must be in the future',
  }),
  address: z.string().min(5, 'Pickup address is required'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  dietaryNotes: z.string().optional().nullable(),
  allergenNotes: z.string().optional().nullable(),
  handlingInstructions: z.string().optional().nullable(),
  safetyConfirmation: z.boolean().refine(val => val === true, {
    message: 'Food safety and handling confirmation is required',
  }),
});

const updateListingSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  category: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  preparedAt: z.string().optional().nullable(),
  expiresAt: z.string().optional(),
  pickupStartAt: z.string().optional(),
  pickupEndAt: z.string().optional(),
  address: z.string().min(5).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  dietaryNotes: z.string().optional().nullable(),
  allergenNotes: z.string().optional().nullable(),
  handlingInstructions: z.string().optional().nullable(),
});

/**
 * Periodically updates expired listings in the background/on-demand.
 */
async function expireStaleListings(): Promise<void> {
  const now = new Date();
  await prisma.foodListing.updateMany({
    where: {
      status: { in: [ListingStatus.AVAILABLE, ListingStatus.REQUESTED] },
      OR: [
        { expiresAt: { lte: now } },
        { pickupEndAt: { lte: now } },
      ],
    },
    data: {
      status: ListingStatus.EXPIRED,
    },
  });
}

export async function getListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await expireStaleListings();

    const {
      search,
      category,
      status,
      providerId,
      sortBy = 'urgency', // 'urgency' | 'newest' | 'recommended' | 'quantity'
      page = '1',
      limit = '12',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '12', 10)));
    const skip = (pageNum - 1) * limitNum;

    // Filter construction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (providerId) {
      where.providerId = providerId;
    } else if (status) {
      where.status = status;
    } else {
      // Default for public / recipient browsing: show AVAILABLE only
      where.status = ListingStatus.AVAILABLE;
    }

    // Sorting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { expiresAt: 'asc' }; // default urgency
    if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'quantity') {
      orderBy = { remainingQuantity: 'desc' };
    }

    const [listings, total] = await Promise.all([
      prisma.foodListing.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          provider: {
            select: { id: true, name: true, email: true, phone: true },
          },
          _count: {
            select: { requests: true },
          },
        },
      }),
      prisma.foodListing.count({ where }),
    ]);

    // If requester is a verified recipient, attach explainable match recommendations
    let recipientOrg: any = null;
    if (req.user?.role === UserRole.RECIPIENT) {
      recipientOrg = await prisma.organization.findUnique({
        where: { userId: req.user.id },
      });
    }

    const enhancedListings = listings.map((listing) => {
      const match = recipientOrg
        ? calculateMatchScore(listing, recipientOrg)
        : null;

      return {
        ...listing,
        recommendation: match,
      };
    });

    // If sorting by recommendation, sort in-memory
    if (sortBy === 'recommended' && recipientOrg) {
      enhancedListings.sort(
        (a, b) => (b.recommendation?.score || 0) - (a.recommendation?.score || 0)
      );
    }

    res.json({
      success: true,
      data: enhancedListings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getListingById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await expireStaleListings();
    const { id } = req.params;

    const listing = await prisma.foodListing.findUnique({
      where: { id },
      include: {
        provider: {
          select: { id: true, name: true, phone: true, serviceArea: true },
        },
        requests: {
          include: {
            recipientOrganization: {
              select: { id: true, name: true, organizationType: true, address: true },
            },
            assignment: {
              include: {
                volunteer: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new AppError('Food listing not found', 404);
    }

    // Recommendation computation if user is recipient
    let match = null;
    if (req.user?.role === UserRole.RECIPIENT) {
      const org = await prisma.organization.findUnique({
        where: { userId: req.user.id },
      });
      match = calculateMatchScore(listing, org);
    }

    res.json({
      success: true,
      data: {
        ...listing,
        recommendation: match,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createListingSchema.parse(req.body);

    const pickupStart = new Date(data.pickupStartAt);
    const pickupEnd = new Date(data.pickupEndAt);
    const expiresAt = new Date(data.expiresAt);

    if (pickupEnd.getTime() <= pickupStart.getTime()) {
      throw new AppError('Pickup end time must be after pickup start time', 400);
    }

    if (expiresAt.getTime() < pickupEnd.getTime()) {
      throw new AppError('Use-by/expiry time cannot be earlier than pickup end time', 400);
    }

    const listing = await prisma.foodListing.create({
      data: {
        providerId: req.user!.id,
        title: data.title,
        description: data.description,
        category: data.category,
        quantity: data.quantity,
        remainingQuantity: data.quantity,
        unit: data.unit,
        preparedAt: data.preparedAt ? new Date(data.preparedAt) : null,
        expiresAt,
        pickupStartAt: pickupStart,
        pickupEndAt: pickupEnd,
        address: data.address,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        dietaryNotes: data.dietaryNotes || null,
        allergenNotes: data.allergenNotes || null,
        handlingInstructions: data.handlingInstructions || null,
        safetyConfirmation: data.safetyConfirmation,
        status: ListingStatus.AVAILABLE,
      },
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'LISTING_CREATED',
      entityType: 'FoodListing',
      entityId: listing.id,
      metadata: {
        title: listing.title,
        category: listing.category,
        quantity: listing.quantity,
        unit: listing.unit,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Surplus food listing created successfully',
      data: listing,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateListingSchema.parse(req.body);

    const existing = await prisma.foodListing.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Listing not found', 404);
    }

    // Role check: only creator provider or ADMIN can update
    if (existing.providerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      throw new AppError('You can only update your own listings', 403);
    }

    if (existing.status !== ListingStatus.AVAILABLE && existing.status !== ListingStatus.REQUESTED) {
      throw new AppError(`Cannot edit listing in '${existing.status}' state`, 400);
    }

    const updated = await prisma.foodListing.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.quantity && {
          quantity: data.quantity,
          remainingQuantity: data.quantity, // resets remaining if updated
        }),
        ...(data.unit && { unit: data.unit }),
        ...(data.preparedAt !== undefined && {
          preparedAt: data.preparedAt ? new Date(data.preparedAt) : null,
        }),
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
        ...(data.pickupStartAt && { pickupStartAt: new Date(data.pickupStartAt) }),
        ...(data.pickupEndAt && { pickupEndAt: new Date(data.pickupEndAt) }),
        ...(data.address && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.dietaryNotes !== undefined && { dietaryNotes: data.dietaryNotes }),
        ...(data.allergenNotes !== undefined && { allergenNotes: data.allergenNotes }),
        ...(data.handlingInstructions !== undefined && { handlingInstructions: data.handlingInstructions }),
      },
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'LISTING_UPDATED',
      entityType: 'FoodListing',
      entityId: updated.id,
      metadata: { title: updated.title },
    });

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await prisma.foodListing.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Listing not found', 404);
    }

    if (existing.providerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      throw new AppError('You can only cancel your own listings', 403);
    }

    if (!isValidListingTransition(existing.status as any, ListingStatus.CANCELLED)) {
      throw new AppError(`Cannot cancel a listing in '${existing.status}' state`, 400);
    }

    const updated = await prisma.foodListing.update({
      where: { id },
      data: {
        status: ListingStatus.CANCELLED,
      },
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'LISTING_CANCELLED',
      entityType: 'FoodListing',
      entityId: updated.id,
      metadata: { reason: reason || 'Cancelled by provider' },
    });

    res.json({
      success: true,
      message: 'Listing cancelled successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
