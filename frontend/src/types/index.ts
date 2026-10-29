export type UserRole = 'PROVIDER' | 'RECIPIENT' | 'VOLUNTEER' | 'ADMIN';

export type ListingStatus =
  | 'AVAILABLE'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'VOLUNTEER_ASSIGNED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export type AssignmentStatus = 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';

export type OrgVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  serviceArea?: string | null;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
  organization?: Organization | null;
}

export interface Organization {
  id: string;
  userId: string;
  name: string;
  organizationType: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  contactPerson?: string | null;
  phone?: string | null;
  serviceRadiusKm: number;
  preferredCategories?: string[] | string | null;
  verificationStatus: OrgVerificationStatus;
  verificationReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface FactorBreakdown {
  score: number;
  weightedScore: number;
  weight: number;
  reason: string;
}

export interface MatchScoreResult {
  isEligible: boolean;
  ineligibilityReason?: string;
  score: number;
  breakdown: {
    distance?: FactorBreakdown;
    pickupTime: FactorBreakdown;
    quantityFit: FactorBreakdown;
    categoryPref: FactorBreakdown;
    urgency: FactorBreakdown;
  };
  reasons: string[];
  calculatedDistanceKm: number | null;
  hasIncompleteLocationData: boolean;
}

export interface FoodListing {
  id: string;
  providerId: string;
  provider?: {
    id: string;
    name: string;
    email?: string;
    phone?: string | null;
    serviceArea?: string | null;
  };
  title: string;
  description: string;
  category: string;
  quantity: number;
  remainingQuantity: number;
  unit: string;
  preparedAt?: string | null;
  expiresAt: string;
  pickupStartAt: string;
  pickupEndAt: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  dietaryNotes?: string | null;
  allergenNotes?: string | null;
  handlingInstructions?: string | null;
  safetyConfirmation: boolean;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  recommendation?: MatchScoreResult | null;
  requests?: DonationRequest[];
  _count?: {
    requests: number;
  };
}

export interface DonationRequest {
  id: string;
  listingId: string;
  listing: FoodListing;
  recipientOrganizationId: string;
  recipientOrganization: Organization;
  requestedQuantity: number;
  acceptedQuantity?: number | null;
  status: RequestStatus;
  providerResponseReason?: string | null;
  requestedAt: string;
  respondedAt?: string | null;
  createdAt: string;
  assignment?: VolunteerAssignment | null;
}

export interface VolunteerAssignment {
  id: string;
  donationRequestId: string;
  donationRequest: DonationRequest;
  volunteerId: string;
  volunteer: {
    id: string;
    name: string;
    phone?: string | null;
  };
  status: AssignmentStatus;
  assignedAt: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  pickupNotes?: string | null;
  deliveryNotes?: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorUserId?: string | null;
  actor?: {
    name: string;
    email: string;
    role: string;
  } | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  isDemoData: boolean;
  notice: string;
  metrics: {
    activeListings: number;
    pendingRequests: number;
    completedDonations: number;
    activeVolunteers: number;
    totalListings: number;
    totalUnitsRescued: number;
  };
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  educationalEstimates: {
    disclaimer: string;
    estimatedKgCO2eAvoided: number;
  };
}
