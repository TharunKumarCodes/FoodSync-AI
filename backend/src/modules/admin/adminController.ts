import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/audit';
import { createNotification } from '../../utils/notifications';
import { ListingStatus, RequestStatus, OrgVerificationStatus } from '../../config';

const rejectOrgSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export async function getAdminOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalUsers,
      totalProviders,
      totalRecipients,
      totalVolunteers,
      activeListings,
      totalListings,
      pendingRequests,
      completedDonations,
      pendingVerifications,
      totalAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PROVIDER' } }),
      prisma.user.count({ where: { role: 'RECIPIENT' } }),
      prisma.user.count({ where: { role: 'VOLUNTEER' } }),
      prisma.foodListing.count({ where: { status: ListingStatus.AVAILABLE } }),
      prisma.foodListing.count(),
      prisma.donationRequest.count({ where: { status: RequestStatus.PENDING } }),
      prisma.donationRequest.count({ where: { status: RequestStatus.COMPLETED } }),
      prisma.organization.count({ where: { verificationStatus: OrgVerificationStatus.PENDING } }),
      prisma.auditLog.count(),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          providers: totalProviders,
          recipients: totalRecipients,
          volunteers: totalVolunteers,
        },
        listings: {
          active: activeListings,
          total: totalListings,
        },
        requests: {
          pending: pendingRequests,
          completed: completedDonations,
        },
        organizations: {
          pendingVerification: pendingVerifications,
        },
        auditLogsCount: totalAuditLogs,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPendingOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgs = await prisma.organization.findMany({
      where: { verificationStatus: OrgVerificationStatus.PENDING },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: orgs,
    });
  } catch (err) {
    next(err);
  }
}

export async function approveOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        verificationStatus: OrgVerificationStatus.VERIFIED,
        reviewedBy: req.user!.name,
        reviewedAt: new Date(),
        verificationReason: 'Verified by administrator after reviewing organization credentials',
      },
    });

    await createNotification({
      userId: org.userId,
      type: 'VERIFICATION_APPROVED',
      title: 'Organization Verified! 🎉',
      message: `Congratulations! ${org.name} has been verified. You can now request available surplus food listings across the platform.`,
      relatedEntityType: 'Organization',
      relatedEntityId: org.id,
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ORGANIZATION_VERIFIED',
      entityType: 'Organization',
      entityId: org.id,
      metadata: { organizationName: org.name, approvedBy: req.user!.email },
    });

    res.json({
      success: true,
      message: `Organization ${org.name} has been verified successfully.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = rejectOrgSchema.parse(req.body);

    const org = await prisma.organization.findUnique({
      where: { id },
    });

    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        verificationStatus: OrgVerificationStatus.REJECTED,
        verificationReason: reason,
        reviewedBy: req.user!.name,
        reviewedAt: new Date(),
      },
    });

    await createNotification({
      userId: org.userId,
      type: 'VERIFICATION_REJECTED',
      title: 'Verification Request Update',
      message: `Your organization verification could not be approved at this time. Reason: ${reason}`,
      relatedEntityType: 'Organization',
      relatedEntityId: org.id,
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: 'ORGANIZATION_REJECTED',
      entityType: 'Organization',
      entityId: org.id,
      metadata: { reason, rejectedBy: req.user!.email },
    });

    res.json({
      success: true,
      message: `Organization ${org.name} verification rejected.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, status, search } = req.query as Record<string, string | undefined>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (role) where.role = role;
    if (status) where.accountStatus = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        serviceArea: true,
        accountStatus: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            organizationType: true,
            verificationStatus: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = userStatusSchema.parse(req.body);

    if (id === req.user!.id) {
      throw new AppError('Administrators cannot change their own account status', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { accountStatus: status },
      select: { id: true, name: true, email: true, accountStatus: true },
    });

    await createAuditLog({
      actorUserId: req.user!.id,
      action: `USER_STATUS_${status}`,
      entityType: 'User',
      entityId: id,
      metadata: { newStatus: status },
    });

    res.json({
      success: true,
      message: `User status changed to ${status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action, entityType, page = '1', limit = '20' } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
    const skip = (pageNum - 1) * limitNum;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (action) where.action = { contains: action };
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
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

export async function exportAuditLogsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        actor: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    const headers = ['ID', 'Timestamp', 'Actor Name', 'Actor Email', 'Actor Role', 'Action', 'Entity Type', 'Entity ID', 'Metadata'];
    const rows = logs.map(l => [
      l.id,
      l.createdAt.toISOString(),
      `"${(l.actor?.name || 'SYSTEM').replace(/"/g, '""')}"`,
      `"${(l.actor?.email || 'SYSTEM').replace(/"/g, '""')}"`,
      l.actor?.role || 'SYSTEM',
      l.action,
      l.entityType,
      l.entityId,
      `"${(l.metadata || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="foodloop_audit_logs.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
}
