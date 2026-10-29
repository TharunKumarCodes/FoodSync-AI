import { config } from '../../config';
import { calculateHaversineDistance } from '../../utils/haversine';

export interface ListingCandidate {
  id: string;
  title: string;
  category: string;
  quantity: number;
  remainingQuantity: number;
  unit: string;
  expiresAt: Date | string;
  pickupStartAt: Date | string;
  pickupEndAt: Date | string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface RecipientProfile {
  id: string;
  verificationStatus: string;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm?: number | null;
  preferredCategories?: string[] | string | null;
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
  score: number; // 0 to 100
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

/**
 * Evaluates listing eligibility and computes an explainable match score
 * for a recipient organization based on transparent, configured rules.
 */
export function calculateMatchScore(
  listing: ListingCandidate,
  recipient?: RecipientProfile | null,
  referenceTime: Date = new Date()
): MatchScoreResult {
  const expiresAt = new Date(listing.expiresAt);
  const pickupEndAt = new Date(listing.pickupEndAt);
  const now = referenceTime.getTime();

  // 1. Hard Eligibility Gates
  if (listing.status !== 'AVAILABLE') {
    return {
      isEligible: false,
      ineligibilityReason: `Listing status is '${listing.status}' (not AVAILABLE)`,
      score: 0,
      breakdown: createEmptyBreakdown(),
      reasons: [`Listing is currently ${listing.status.toLowerCase()}`],
      calculatedDistanceKm: null,
      hasIncompleteLocationData: false,
    };
  }

  if (listing.remainingQuantity <= 0) {
    return {
      isEligible: false,
      ineligibilityReason: 'Remaining quantity is 0',
      score: 0,
      breakdown: createEmptyBreakdown(),
      reasons: ['No remaining quantity available'],
      calculatedDistanceKm: null,
      hasIncompleteLocationData: false,
    };
  }

  if (expiresAt.getTime() <= now || pickupEndAt.getTime() <= now) {
    return {
      isEligible: false,
      ineligibilityReason: 'Listing or pickup window has expired',
      score: 0,
      breakdown: createEmptyBreakdown(),
      reasons: ['Pickup window or use-by deadline has passed'],
      calculatedDistanceKm: null,
      hasIncompleteLocationData: false,
    };
  }

  if (recipient && recipient.verificationStatus !== 'VERIFIED') {
    return {
      isEligible: false,
      ineligibilityReason: 'Organization is not verified',
      score: 0,
      breakdown: createEmptyBreakdown(),
      reasons: ['Organization verification required to request food'],
      calculatedDistanceKm: null,
      hasIncompleteLocationData: false,
    };
  }

  // 2. Compute individual factor scores (0-100)
  const reasons: string[] = [];
  const weights = config.matchingWeights;

  // Factor A: Distance (Weight: 35%)
  const distanceKm = calculateHaversineDistance(
    recipient?.latitude,
    recipient?.longitude,
    listing.latitude,
    listing.longitude
  );

  let distanceFactor: FactorBreakdown | undefined;
  const hasIncompleteLocationData = distanceKm === null;

  if (distanceKm !== null) {
    const serviceRadius = recipient?.serviceRadiusKm || 15;
    let distScore = 0;
    let distReason = '';

    if (distanceKm <= 3) {
      distScore = 100;
      distReason = `Very close to your facility (${distanceKm} km)`;
    } else if (distanceKm <= serviceRadius) {
      // Linear scale from 100 down to 60 within service radius
      const ratio = (distanceKm - 3) / Math.max(1, serviceRadius - 3);
      distScore = Math.round(100 - ratio * 40);
      distReason = `Within your preferred service radius (${distanceKm} km away)`;
    } else {
      // Outside radius: drop to 20 or lower
      const excess = distanceKm - serviceRadius;
      distScore = Math.max(0, Math.round(50 - excess * 5));
      distReason = `Outside preferred service radius (${distanceKm} km away)`;
    }

    distanceFactor = {
      score: distScore,
      weight: weights.distance,
      weightedScore: (distScore * weights.distance),
      reason: distReason,
    };
    reasons.push(distReason);
  } else {
    reasons.push('Location coordinates missing; distance factor omitted fairly');
  }

  // Factor B: Pickup Time Compatibility (Weight: 25%)
  const hoursUntilPickupEnd = (pickupEndAt.getTime() - now) / (1000 * 60 * 60);
  let pickupScore = 50;
  let pickupReason = '';

  if (hoursUntilPickupEnd >= 3) {
    pickupScore = 100;
    pickupReason = `Ample pickup window (${Math.round(hoursUntilPickupEnd)} hours remaining)`;
  } else if (hoursUntilPickupEnd >= 1) {
    pickupScore = 80;
    pickupReason = `Pickup window open (${Math.round(hoursUntilPickupEnd * 10) / 10} hours left)`;
  } else {
    pickupScore = 40;
    pickupReason = 'Urgent pickup: less than 1 hour remaining in window';
  }

  const pickupFactor: FactorBreakdown = {
    score: pickupScore,
    weight: weights.pickupTime,
    weightedScore: (pickupScore * weights.pickupTime),
    reason: pickupReason,
  };
  reasons.push(pickupReason);

  // Factor C: Quantity Fit (Weight: 20%)
  let qtyScore = 60;
  let qtyReason = '';
  if (listing.remainingQuantity >= 15) {
    qtyScore = 100;
    qtyReason = `Substantial quantity available (${listing.remainingQuantity} ${listing.unit})`;
  } else if (listing.remainingQuantity >= 5) {
    qtyScore = 85;
    qtyReason = `Good portion size available (${listing.remainingQuantity} ${listing.unit})`;
  } else {
    qtyScore = 70;
    qtyReason = `Small batch quantity (${listing.remainingQuantity} ${listing.unit})`;
  }

  const quantityFactor: FactorBreakdown = {
    score: qtyScore,
    weight: weights.quantityFit,
    weightedScore: (qtyScore * weights.quantityFit),
    reason: qtyReason,
  };
  reasons.push(qtyReason);

  // Factor D: Category Preference (Weight: 10%)
  let catScore = 70;
  let catReason = `Standard food category (${listing.category.replace(/_/g, ' ')})`;

  if (recipient?.preferredCategories) {
    let prefs: string[] = [];
    if (Array.isArray(recipient.preferredCategories)) {
      prefs = recipient.preferredCategories;
    } else if (typeof recipient.preferredCategories === 'string') {
      try {
        prefs = JSON.parse(recipient.preferredCategories);
      } catch {
        prefs = recipient.preferredCategories.split(',').map(s => s.trim());
      }
    }

    if (prefs.length > 0) {
      if (prefs.includes(listing.category)) {
        catScore = 100;
        catReason = `Matches organization's preferred category (${listing.category.replace(/_/g, ' ')})`;
      } else {
        catScore = 50;
        catReason = `Category differs from stated preferences`;
      }
    }
  }

  const categoryFactor: FactorBreakdown = {
    score: catScore,
    weight: weights.categoryPref,
    weightedScore: (catScore * weights.categoryPref),
    reason: catReason,
  };
  reasons.push(catReason);

  // Factor E: Urgency (Weight: 10%)
  const hoursUntilExpiry = (expiresAt.getTime() - now) / (1000 * 60 * 60);
  let urgencyScore = 50;
  let urgencyReason = '';

  if (hoursUntilExpiry <= 6) {
    urgencyScore = 100;
    urgencyReason = `High rescue priority: expires in ${Math.max(1, Math.round(hoursUntilExpiry))} hours`;
  } else if (hoursUntilExpiry <= 24) {
    urgencyScore = 80;
    urgencyReason = `Moderate urgency: expires today`;
  } else {
    urgencyScore = 50;
    urgencyReason = 'Normal shelf-life remaining';
  }

  const urgencyFactor: FactorBreakdown = {
    score: urgencyScore,
    weight: weights.urgency,
    weightedScore: (urgencyScore * weights.urgency),
    reason: urgencyReason,
  };
  reasons.push(urgencyReason);

  // 3. Normalization
  let totalScore = 0;
  if (distanceFactor) {
    totalScore =
      distanceFactor.weightedScore +
      pickupFactor.weightedScore +
      quantityFactor.weightedScore +
      categoryFactor.weightedScore +
      urgencyFactor.weightedScore;
  } else {
    // Fairly renormalize when distance is missing
    const availableWeight =
      weights.pickupTime + weights.quantityFit + weights.categoryPref + weights.urgency; // 0.65
    const rawSum =
      pickupFactor.weightedScore +
      quantityFactor.weightedScore +
      categoryFactor.weightedScore +
      urgencyFactor.weightedScore;
    totalScore = rawSum / availableWeight;
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  return {
    isEligible: true,
    score: finalScore,
    breakdown: {
      ...(distanceFactor && { distance: distanceFactor }),
      pickupTime: pickupFactor,
      quantityFit: quantityFactor,
      categoryPref: categoryFactor,
      urgency: urgencyFactor,
    },
    reasons,
    calculatedDistanceKm: distanceKm,
    hasIncompleteLocationData,
  };
}

function createEmptyBreakdown() {
  return {
    pickupTime: { score: 0, weightedScore: 0, weight: 0.25, reason: 'Ineligible' },
    quantityFit: { score: 0, weightedScore: 0, weight: 0.20, reason: 'Ineligible' },
    categoryPref: { score: 0, weightedScore: 0, weight: 0.10, reason: 'Ineligible' },
    urgency: { score: 0, weightedScore: 0, weight: 0.10, reason: 'Ineligible' },
  };
}
