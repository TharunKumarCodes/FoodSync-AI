import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, UserRoleType } from '../config';
import { prisma } from '../utils/prisma';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRoleType;
  accountStatus: string;
  organizationId?: string | null;
  organizationVerificationStatus?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    if (!decoded || !decoded.userId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: {
          select: { id: true, verificationStatus: true },
        },
      },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      return next();
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRoleType,
      accountStatus: user.accountStatus,
      organizationId: user.organization?.id || null,
      organizationVerificationStatus: user.organization?.verificationStatus || null,
    };

    next();
  } catch {
    // Invalid or expired token: proceed without req.user
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
    });
    return;
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export function requireVerifiedRecipient(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'RECIPIENT') {
    res.status(403).json({ success: false, error: 'Only recipient organizations can perform this action' });
    return;
  }

  if (req.user.organizationVerificationStatus !== 'VERIFIED') {
    res.status(403).json({
      success: false,
      error: 'Organization verification is required to request food or reserve donations. Current status: ' + (req.user.organizationVerificationStatus || 'UNREGISTERED'),
      code: 'VERIFICATION_REQUIRED',
    });
    return;
  }

  next();
}
