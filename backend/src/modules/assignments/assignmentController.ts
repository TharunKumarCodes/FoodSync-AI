import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/audit';
import { createNotification } from '../../utils/notifications';
import { AssignmentStatus, ListingStatus, RequestStatus, UserRole } from '../../config';
import { isValidAssignmentTransition } from '../../utils/lifecycle';

const pickupSchema = z.object({
  pickupNotes: z.string().optional(),
});

const deliverSchema = z.object({
  deliveryNotes: z.string().optional(),
});

export async function getAvailableTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Available tasks are ACCEPTED donation requests with no assignment yet
    const unassignedRequests = await prisma.donationRequest.findMany({
      where: {
        status: RequestStatus.ACCEPTED,
        assignment: null,
        listing: {
          status: { in: [ListingStatus.ACCEPTED, ListingStatus.REQUESTED] },
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            category: true,
            unit: true,
            pickupStartAt: true,
            pickupEndAt: true,
            address: true,
            latitude: true,
            longitude: true,
            handlingInstructions: true,
            dietaryNotes: true,
          },
        },
        recipientOrganization: {
          select: {
            id: true,
            name: true,
            organizationType: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { listing: { pickupEndAt: 'asc' } },
    });

    res.json({
      success: true,
      data: unassignedRequests,
    });
  } catch (err) {
    next(err);
  }
}

export async function claimTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: donationRequestId } = req.params;
    const volunteerId = req.user!.id;

    // Atomic transaction prevents race conditions when two volunteers attempt to claim the same task
    const assignment = await prisma.$transaction(async (tx) => {
      const request = await tx.donationRequest.findUnique({
        where: { id: donationRequestId },
        include: {
          assignment: true,
          listing: true,
          recipientOrganization: true,
        },
      });

      if (!request) {
        throw new AppError('Donation request not found', 404);
      }

      if (request.status !== RequestStatus.ACCEPTED) {
        throw new AppError(`Cannot claim task for request with status '${request.status}'`, 400);
      }

      if (request.assignment) {
        throw new AppError('This task has already been claimed by another volunteer', 409);
      }

      // Create volunteer assignment
      const newAssignment = await tx.volunteerAssignment.create({
        data: {
          donationRequestId,
          volunteerId,
          status: AssignmentStatus.ASSIGNED,
        },
      });

      // Update listing status to VOLUNTEER_ASSIGNED
      await tx.foodListing.update({
        where: { id: request.listingId },
        data: { status: ListingStatus.VOLUNTEER_ASSIGNED },
      });

      return { newAssignment, request };
    });

    // Notify provider and recipient that a volunteer has stepped forward
    await Promise.all([
      createNotification({
        userId: assignment.request.listing.providerId,
        type: 'VOLUNTEER_ASSIGNED',
        title: 'Volunteer Assigned to Pickup',
        message: `${req.user!.name} will handle food pickup for '${assignment.request.listing.title}'.`,
        relatedEntityType: 'VolunteerAssignment',
        relatedEntityId: assignment.newAssignment.id,
      }),
      createNotification({
        userId: assignment.request.recipientOrganization.userId,
        type: 'VOLUNTEER_ASSIGNED',
        title: 'Volunteer En Route for Delivery',
        message: `Volunteer ${req.user!.name} has claimed the transport for your donation.`,
        relatedEntityType: 'VolunteerAssignment',
        relatedEntityId: assignment.newAssignment.id,
      }),
    ]);

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'VOLUNTEER_TASK_CLAIMED',
      entityType: 'VolunteerAssignment',
      entityId: assignment.newAssignment.id,
      metadata: { donationRequestId },
    });

    res.status(201).json({
      success: true,
      message: 'You have claimed this delivery task! Please coordinate safe pickup within the window.',
      data: assignment.newAssignment,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignments = await prisma.volunteerAssignment.findMany({
      where: { volunteerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        donationRequest: {
          include: {
            listing: {
              include: {
                provider: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
            recipientOrganization: {
              select: {
                id: true,
                name: true,
                organizationType: true,
                address: true,
                contactPerson: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    next(err);
  }
}

export async function markPickedUp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = pickupSchema.parse(req.body);

    const assignment = await prisma.volunteerAssignment.findUnique({
      where: { id },
      include: {
        donationRequest: {
          include: {
            listing: true,
            recipientOrganization: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (assignment.volunteerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Only the assigned volunteer can update pickup progress', 403);
    }

    if (!isValidAssignmentTransition(assignment.status as any, AssignmentStatus.PICKED_UP)) {
      throw new AppError(`Cannot mark as picked up from current status '${assignment.status}'`, 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.volunteerAssignment.update({
        where: { id },
        data: {
          status: AssignmentStatus.PICKED_UP,
          pickedUpAt: new Date(),
          pickupNotes: body.pickupNotes || null,
        },
      });

      await tx.foodListing.update({
        where: { id: assignment.donationRequest.listingId },
        data: { status: ListingStatus.PICKED_UP },
      });

      return updatedAssignment;
    });

    // Notify recipient
    await createNotification({
      userId: assignment.donationRequest.recipientOrganization.userId,
      type: 'PICKUP_COMPLETED',
      title: 'Food Has Been Picked Up! 🚗',
      message: `Volunteer is now transporting '${assignment.donationRequest.listing.title}' to your location.`,
      relatedEntityType: 'VolunteerAssignment',
      relatedEntityId: id,
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'VOLUNTEER_PICKED_UP',
      entityType: 'VolunteerAssignment',
      entityId: id,
      metadata: { pickupNotes: body.pickupNotes },
    });

    res.json({
      success: true,
      message: 'Pickup recorded. Transport to destination is now in progress.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function markDelivered(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = deliverSchema.parse(req.body);

    const assignment = await prisma.volunteerAssignment.findUnique({
      where: { id },
      include: {
        donationRequest: {
          include: {
            listing: true,
            recipientOrganization: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (assignment.volunteerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Only the assigned volunteer can update delivery progress', 403);
    }

    if (!isValidAssignmentTransition(assignment.status as any, AssignmentStatus.DELIVERED)) {
      throw new AppError(`Cannot mark as delivered from current status '${assignment.status}'`, 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.volunteerAssignment.update({
        where: { id },
        data: {
          status: AssignmentStatus.DELIVERED,
          deliveredAt: new Date(),
          deliveryNotes: body.deliveryNotes || null,
        },
      });

      // Update donation request to COMPLETED
      await tx.donationRequest.update({
        where: { id: assignment.donationRequestId },
        data: { status: RequestStatus.COMPLETED },
      });

      // Check if listing has remaining quantity; if 0, complete listing
      const listing = await tx.foodListing.findUnique({
        where: { id: assignment.donationRequest.listingId },
      });

      if (listing && listing.remainingQuantity === 0) {
        await tx.foodListing.update({
          where: { id: listing.id },
          data: { status: ListingStatus.COMPLETED },
        });
      }

      return updatedAssignment;
    });

    // Notify provider and recipient
    await Promise.all([
      createNotification({
        userId: assignment.donationRequest.listing.providerId,
        type: 'DELIVERY_CONFIRMED',
        title: 'Donation Completed! 🌟',
        message: `Your food surplus donation '${assignment.donationRequest.listing.title}' was safely delivered to ${assignment.donationRequest.recipientOrganization.name}. Thank you!`,
        relatedEntityType: 'VolunteerAssignment',
        relatedEntityId: id,
      }),
      createNotification({
        userId: assignment.donationRequest.recipientOrganization.userId,
        type: 'DELIVERY_CONFIRMED',
        title: 'Food Delivery Completed! 🍽️',
        message: `The surplus food from '${assignment.donationRequest.listing.title}' has been delivered to your facility.`,
        relatedEntityType: 'VolunteerAssignment',
        relatedEntityId: id,
      }),
    ]);

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'VOLUNTEER_DELIVERED',
      entityType: 'VolunteerAssignment',
      entityId: id,
      metadata: { deliveryNotes: body.deliveryNotes },
    });

    res.json({
      success: true,
      message: 'Delivery recorded successfully! The donation loop is complete.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
