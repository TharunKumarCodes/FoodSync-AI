import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'foodloop_default_secret_key_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Recommendation engine weights (FR-07)
  matchingWeights: {
    distance: 0.35,      // 35%
    pickupTime: 0.25,    // 25%
    quantityFit: 0.20,   // 20%
    categoryPref: 0.10,  // 10%
    urgency: 0.10,       // 10%
  },
};

export const UserRole = {
  PROVIDER: 'PROVIDER',
  RECIPIENT: 'RECIPIENT',
  VOLUNTEER: 'VOLUNTEER',
  ADMIN: 'ADMIN',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const ListingStatus = {
  AVAILABLE: 'AVAILABLE',
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  VOLUNTEER_ASSIGNED: 'VOLUNTEER_ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type ListingStatusType = (typeof ListingStatus)[keyof typeof ListingStatus];

export const RequestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type RequestStatusType = (typeof RequestStatus)[keyof typeof RequestStatus];

export const AssignmentStatus = {
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type AssignmentStatusType = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const OrgVerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type OrgVerificationStatusType = (typeof OrgVerificationStatus)[keyof typeof OrgVerificationStatus];

export const FoodCategory = {
  PREPARED_MEALS: 'PREPARED_MEALS',
  BAKERY: 'BAKERY',
  PRODUCE: 'PRODUCE',
  DAIRY: 'DAIRY',
  PACKAGED: 'PACKAGED',
  CANNED: 'CANNED',
  OTHER: 'OTHER',
} as const;
