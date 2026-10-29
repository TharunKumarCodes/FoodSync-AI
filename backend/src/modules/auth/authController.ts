import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { config, UserRole } from '../../config';
import { createAuditLog } from '../../utils/audit';
import { AppError } from '../../middleware/errorHandler';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([UserRole.PROVIDER, UserRole.RECIPIENT, UserRole.VOLUNTEER]),
  phone: z.string().optional(),
  serviceArea: z.string().optional(),
  // For RECIPIENT organization registration
  organizationName: z.string().optional(),
  organizationType: z.string().optional(),
  organizationAddress: z.string().optional(),
  organizationLatitude: z.number().optional(),
  organizationLongitude: z.number().optional(),
  serviceRadiusKm: z.number().optional(),
  preferredCategories: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user and organization (if recipient) in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: data.role,
          phone: data.phone || null,
          serviceArea: data.serviceArea || null,
        },
      });

      if (data.role === UserRole.RECIPIENT && data.organizationName) {
        await tx.organization.create({
          data: {
            userId: user.id,
            name: data.organizationName,
            organizationType: data.organizationType || 'COMMUNITY_KITCHEN',
            address: data.organizationAddress || user.serviceArea || '123 Community Way',
            latitude: data.organizationLatitude || null,
            longitude: data.organizationLongitude || null,
            contactPerson: user.name,
            phone: user.phone || null,
            serviceRadiusKm: data.serviceRadiusKm || 15.0,
            preferredCategories: data.preferredCategories ? JSON.stringify(data.preferredCategories) : null,
            verificationStatus: 'PENDING',
          },
        });
      }

      return user;
    });

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    await createAuditLog({
      actorUserId: newUser.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      metadata: { role: newUser.role, email: newUser.email },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new AppError('Account is suspended. Please contact administrator.', 403);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    await createAuditLog({
      actorUserId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: user.role },
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        serviceArea: user.serviceArea,
        organization: user.organization
          ? {
              id: user.organization.id,
              name: user.organization.name,
              organizationType: user.organization.organizationType,
              address: user.organization.address,
              verificationStatus: user.organization.verificationStatus,
              verificationReason: user.organization.verificationReason,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        serviceArea: user.serviceArea,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        organization: user.organization,
      },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response): void {
  // Stateless JWT: client discards token
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}
