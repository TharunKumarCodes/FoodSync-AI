import { ListingStatus, ListingStatusType, RequestStatus, RequestStatusType, AssignmentStatus, AssignmentStatusType } from '../config';

// Allowed state transitions for Food Listings
export const VALID_LISTING_TRANSITIONS: Record<ListingStatusType, ListingStatusType[]> = {
  AVAILABLE: ['REQUESTED', 'CANCELLED', 'EXPIRED'],
  REQUESTED: ['ACCEPTED', 'AVAILABLE', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['VOLUNTEER_ASSIGNED', 'PICKED_UP', 'CANCELLED'],
  VOLUNTEER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

// Allowed state transitions for Donation Requests
export const VALID_REQUEST_TRANSITIONS: Record<RequestStatusType, RequestStatusType[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};

// Allowed state transitions for Volunteer Assignments
export const VALID_ASSIGNMENT_TRANSITIONS: Record<AssignmentStatusType, AssignmentStatusType[]> = {
  ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function isValidListingTransition(from: ListingStatusType, to: ListingStatusType): boolean {
  if (from === to) return true;
  const allowed = VALID_LISTING_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function isValidRequestTransition(from: RequestStatusType, to: RequestStatusType): boolean {
  if (from === to) return true;
  const allowed = VALID_REQUEST_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function isValidAssignmentTransition(from: AssignmentStatusType, to: AssignmentStatusType): boolean {
  if (from === to) return true;
  const allowed = VALID_ASSIGNMENT_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
