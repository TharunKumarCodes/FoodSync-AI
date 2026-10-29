import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/audit';
import { createNotification } from '../../utils/notifications';

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  organizationType: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  serviceRadiusKm: z.number().min(1).max(200).optional(),
  preferredCategories: z.array(z.string()).optional(),
});

export async function getMyOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const org = await prisma.organization.findUnique({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { requests: true },
        },
      },
    });

    if (!org) {
      throw new AppError('No organization profile found for this account', 404);
    }

    res.json({
      success: true,
      organization: {
        ...org,
        preferredCategories: org.preferredCategories ? JSON.parse(org.preferredCategories) : [],
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMyOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateOrgSchema.parse(req.body);

    const existingOrg = await prisma.organization.findUnique({
      where: { userId: req.user!.id },
    });

    if (!existingOrg) {
      throw new AppError('Organization not found', 404);
    }

    const updated = await prisma.organization.update({
      where: { id: existingOrg.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.organizationType && { organizationType: data.organizationType }),
        ...(data.address && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.contactPerson && { contactPerson: data.contactPerson }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.serviceRadiusKm !== undefined && { serviceRadiusKm: data.serviceRadiusKm }),
        ...(data.preferredCategories !== undefined && {
          preferredCategories: JSON.stringify(data.preferredCategories),
        }),
      },
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'Organization',
      entityId: updated.id,
      metadata: { name: updated.name },
    });

    res.json({
      success: true,
      message: 'Organization profile updated successfully',
      organization: {
        ...updated,
        preferredCategories: updated.preferredCategories ? JSON.parse(updated.preferredCategories) : [],
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function requestVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const org = await prisma.organization.findUnique({
      where: { userId: req.user!.id },
    });

    if (!org) {
      throw new AppError('Organization profile required before requesting verification', 400);
    }

    if (org.verificationStatus === 'VERIFIED') {
      throw new AppError('Organization is already verified', 400);
    }

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        verificationStatus: 'PENDING',
        verificationReason: 'Verification requested by organization administrator',
      },
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'VERIFICATION_REQUESTED',
      entityType: 'Organization',
      entityId: org.id,
      metadata: { organizationName: org.name },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'VERIFICATION_REQUESTED',
        title: 'New Verification Request',
        message: `${org.name} has submitted details for organization verification.`,
        relatedEntityType: 'Organization',
        relatedEntityId: org.id,
      });
    }

    res.json({
      success: true,
      message: 'Verification request submitted. Platform administrators will review your profile.',
      organization: updated,
    });
  } catch (err) {
    next(err);
  }
}
