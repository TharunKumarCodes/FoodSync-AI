import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/audit';
import { createNotification } from '../../utils/notifications';
import { ListingStatus, RequestStatus, UserRole } from '../../config';
import { isValidRequestTransition } from '../../utils/lifecycle';

const createRequestSchema = z.object({
  requestedQuantity: z.number().positive('Requested quantity must be greater than zero'),
  notes: z.string().optional(),
});

const rejectRequestSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required (at least 3 characters)'),
});

const acceptRequestSchema = z.object({
  acceptedQuantity: z.number().positive().optional(),
});

export async function createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: listingId } = req.params;
    const { requestedQuantity } = createRequestSchema.parse(req.body);

    const organization = await prisma.organization.findUnique({
      where: { userId: req.user!.id },
    });

    if (!organization) {
      throw new AppError('Organization profile required before requesting donations', 400);
    }

    if (organization.verificationStatus !== 'VERIFIED') {
      throw new AppError(
        `Only verified organizations may request surplus food. Your status is: ${organization.verificationStatus}`,
        403,
        'VERIFICATION_REQUIRED'
      );
    }

    // Concurrency-safe atomic check & request creation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.foodListing.findUnique({
        where: { id: listingId },
      });

      if (!listing) {
        throw new AppError('Food listing not found', 404);
      }

      if (listing.status !== ListingStatus.AVAILABLE && listing.status !== ListingStatus.REQUESTED) {
        throw new AppError(`Cannot request food from a listing with status '${listing.status}'`, 400);
      }

      if (new Date(listing.expiresAt).getTime() <= Date.now() || new Date(listing.pickupEndAt).getTime() <= Date.now()) {
        throw new AppError('This food listing or pickup window has expired', 400);
      }

      if (requestedQuantity > listing.remainingQuantity) {
        throw new AppError(
          `Requested quantity (${requestedQuantity} ${listing.unit}) exceeds remaining quantity (${listing.remainingQuantity} ${listing.unit})`,
          400
        );
      }

      // Check if this organization already has a pending request for this listing
      const existingPending = await tx.donationRequest.findFirst({
        where: {
          listingId,
          recipientOrganizationId: organization.id,
          status: RequestStatus.PENDING,
        },
      });

      if (existingPending) {
        throw new AppError('Your organization already has a pending request for this listing', 409);
      }

      // Create request
      const donationRequest = await tx.donationRequest.create({
        data: {
          listingId,
          recipientOrganizationId: organization.id,
          requestedQuantity,
          status: RequestStatus.PENDING,
        },
        include: {
          listing: true,
          recipientOrganization: true,
        },
      });

      // Update listing status to REQUESTED if it was AVAILABLE
      if (listing.status === ListingStatus.AVAILABLE) {
        await tx.foodListing.update({
          where: { id: listingId },
          data: { status: ListingStatus.REQUESTED },
        });
      }

      return donationRequest;
    });

    // Notify provider of new request
    await createNotification({
      userId: result.listing.providerId,
      type: 'REQUEST_RECEIVED',
      title: 'New Donation Request',
      message: `${organization.name} requested ${requestedQuantity} ${result.listing.unit} of '${result.listing.title}'.`,
      relatedEntityType: 'DonationRequest',
      relatedEntityId: result.id,
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'REQUEST_CREATED',
      entityType: 'DonationRequest',
      entityId: result.id,
      metadata: {
        listingId,
        requestedQuantity,
        organizationId: organization.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Donation request submitted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organization = await prisma.organization.findUnique({
      where: { userId: req.user!.id },
    });

    if (!organization) {
      res.json({ success: true, data: [] });
      return;
    }

    const requests = await prisma.donationRequest.findMany({
      where: { recipientOrganizationId: organization.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            provider: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        assignment: {
          include: {
            volunteer: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProviderRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requests = await prisma.donationRequest.findMany({
      where: {
        listing: {
          providerId: req.user!.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: true,
        recipientOrganization: true,
        assignment: {
          include: {
            volunteer: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = acceptRequestSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.donationRequest.findUnique({
        where: { id },
        include: {
          listing: true,
          recipientOrganization: true,
        },
      });

      if (!request) {
        throw new AppError('Donation request not found', 404);
      }

      if (request.listing.providerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        throw new AppError('You can only accept requests for your own listings', 403);
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new AppError(`Cannot accept request in '${request.status}' status`, 400);
      }

      const allocatedQty = body.acceptedQuantity || request.requestedQuantity;
      if (allocatedQty > request.listing.remainingQuantity) {
        throw new AppError(
          `Cannot allocate ${allocatedQty} ${request.listing.unit}. Only ${request.listing.remainingQuantity} remaining.`,
          400
        );
      }

      const newRemaining = request.listing.remainingQuantity - allocatedQty;

      // Update donation request
      const updatedRequest = await tx.donationRequest.update({
        where: { id },
        data: {
          status: RequestStatus.ACCEPTED,
          acceptedQuantity: allocatedQty,
          respondedAt: new Date(),
        },
      });

      // Update listing
      const updatedListing = await tx.foodListing.update({
        where: { id: request.listingId },
        data: {
          remainingQuantity: newRemaining,
          status: newRemaining === 0 ? ListingStatus.ACCEPTED : ListingStatus.REQUESTED,
        },
      });

      return { updatedRequest, updatedListing, request };
    });

    // Send in-app notification to recipient organization user
    await createNotification({
      userId: result.request.recipientOrganization.userId,
      type: 'REQUEST_ACCEPTED',
      title: 'Donation Request Accepted! 🎉',
      message: `Your request for ${result.updatedRequest.acceptedQuantity} ${result.request.listing.unit} of '${result.request.listing.title}' was accepted. It is now queued for volunteer pickup!`,
      relatedEntityType: 'DonationRequest',
      relatedEntityId: result.updatedRequest.id,
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'REQUEST_ACCEPTED',
      entityType: 'DonationRequest',
      entityId: id,
      metadata: {
        allocatedQuantity: result.updatedRequest.acceptedQuantity,
        remainingQuantity: result.updatedListing.remainingQuantity,
      },
    });

    res.json({
      success: true,
      message: 'Request accepted successfully. Volunteer pickup task is now active.',
      data: result.updatedRequest,
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = rejectRequestSchema.parse(req.body);

    const request = await prisma.donationRequest.findUnique({
      where: { id },
      include: {
        listing: true,
        recipientOrganization: true,
      },
    });

    if (!request) {
      throw new AppError('Donation request not found', 404);
    }

    if (request.listing.providerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      throw new AppError('You can only reject requests for your own listings', 403);
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new AppError(`Cannot reject request in '${request.status}' status`, 400);
    }

    const updated = await prisma.donationRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        providerResponseReason: reason,
        respondedAt: new Date(),
      },
    });

    // Check if listing has any other pending requests; if not and remainingQuantity > 0, set back to AVAILABLE
    const otherPending = await prisma.donationRequest.count({
      where: {
        listingId: request.listingId,
        status: RequestStatus.PENDING,
      },
    });

    if (otherPending === 0 && request.listing.remainingQuantity > 0) {
      await prisma.foodListing.update({
        where: { id: request.listingId },
        data: { status: ListingStatus.AVAILABLE },
      });
    }

    // Notify recipient
    await createNotification({
      userId: request.recipientOrganization.userId,
      type: 'REQUEST_REJECTED',
      title: 'Donation Request Declined',
      message: `Your request for '${request.listing.title}' was declined. Reason: ${reason}`,
      relatedEntityType: 'DonationRequest',
      relatedEntityId: id,
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'REQUEST_REJECTED',
      entityType: 'DonationRequest',
      entityId: id,
      metadata: { reason },
    });

    res.json({
      success: true,
      message: 'Request rejected',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const request = await prisma.donationRequest.findUnique({
      where: { id },
      include: {
        recipientOrganization: true,
        assignment: true,
      },
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.recipientOrganization.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      throw new AppError('You can only cancel your own requests', 403);
    }

    if (!isValidRequestTransition(request.status as any, RequestStatus.CANCELLED)) {
      throw new AppError(`Cannot cancel request in '${request.status}' status`, 400);
    }

    if (request.assignment) {
      throw new AppError('Cannot cancel request once a volunteer has been assigned. Please coordinate with support.', 400);
    }

    const updated = await prisma.donationRequest.update({
      where: { id },
      data: { status: RequestStatus.CANCELLED },
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'REQUEST_CANCELLED',
      entityType: 'DonationRequest',
      entityId: id,
    });

    res.json({
      success: true,
      message: 'Request cancelled successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
