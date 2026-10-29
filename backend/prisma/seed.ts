import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FoodLoop AI Database Seeding...');

  // Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.volunteerAssignment.deleteMany();
  await prisma.donationRequest.deleteMany();
  await prisma.foodListing.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  const now = new Date();

  // 1. Create Administrator
  const admin = await prisma.user.create({
    data: {
      name: 'Elena Vance (Platform Admin)',
      email: 'admin@foodloop.org',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      phone: '+1 (555) 019-2831',
      serviceArea: 'Central Administration',
    },
  });

  // 2. Create Providers
  const provider1 = await prisma.user.create({
    data: {
      name: 'Chef Marco Rossi (Green Harvest Bistro)',
      email: 'bistro@foodloop.org',
      passwordHash: defaultPasswordHash,
      role: 'PROVIDER',
      phone: '+1 (555) 014-9922',
      serviceArea: 'Downtown Central',
    },
  });

  const provider2 = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins (Sunrise Artisan Bakery)',
      email: 'bakery@foodloop.org',
      passwordHash: defaultPasswordHash,
      role: 'PROVIDER',
      phone: '+1 (555) 018-4411',
      serviceArea: 'Mission District',
    },
  });

  // 3. Create Recipient Organizations (1 Verified, 1 Pending)
  const recipientUser1 = await prisma.user.create({
    data: {
      name: 'David Miller (Hope Kitchen Director)',
      email: 'shelter@foodloop.org',
      passwordHash: defaultPasswordHash,
      role: 'RECIPIENT',
      phone: '+1 (555) 012-3456',
      serviceArea: 'Downtown & Civic Center',
    },
  });

  const orgVerified = await prisma.organization.create({
    data: {
      userId: recipientUser1.id,
      name: 'Hope Community Kitchen & Shelter',
      organizationType: 'COMMUNITY_KITCHEN',
      address: '450 Civic Center Plaza, San Francisco, CA',
      latitude: 37.7785,
      longitude: -122.4167,
      contactPerson: 'David Miller',
      phone: '+1 (555) 012-3456',
      serviceRadiusKm: 15.0,
      preferredCategories: JSON.stringify(['PREPARED_MEALS', 'BAKERY', 'PRODUCE']),
      verificationStatus: 'VERIFIED',
      verificationReason: 'Verified 501(c)(3) nonprofit partner and community health certified kitchen.',
      reviewedBy: 'Elena Vance',
      reviewedAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
    },
  });

  const recipientUser2 = await prisma.user.create({
    data: {
      name: 'Amara Chen (Youth Project Lead)',
      email: 'youth@foodloop.org',
      passwordHash: defaultPasswordHash,
      role: 'RECIPIENT',
      phone: '+1 (555) 017-8899',
      serviceArea: 'North Beach Community',
    },
  });

  const orgPending = await prisma.organization.create({
    data: {
      userId: recipientUser2.id,
      name: 'Northside Youth Nutrition Project',
      organizationType: 'NGO',
      address: '890 Columbus Ave, San Francisco, CA',
      latitude: 37.7937,
      longitude: -122.4045,
      contactPerson: 'Amara Chen',
      phone: '+1 (555) 017-8899',
      serviceRadiusKm: 10.0,
      preferredCategories: JSON.stringify(['PREPARED_MEALS', 'DAIRY', 'PRODUCE']),
      verificationStatus: 'PENDING',
      verificationReason: 'Pending administrative review of municipal affiliation documents.',
    },
  });

  // 4. Create Volunteers
  const volunteer1 = await prisma.user.create({
    data: {
      name: 'Alex Rivera (Cargo Bike Volunteer)',
      email: 'alex.volunteer@foodloop.org',
      passwordHash: defaultPasswordHash,
      role: 'VOLUNTEER',
      phone: '+1 (555) 016-7733',
      serviceArea: 'Downtown / SoMa / Civic Center',
    },
  });

  const volunteer2 = await prisma.user.create({
    data: {
      name: 'Maya Patel (Van Transport Volunteer)',
      email: 'maya.volunteer@foodloop.org',
      passwordHash: defaultPasswordHash,
      role: 'VOLUNTEER',
      phone: '+1 (555) 013-5544',
      serviceArea: 'Mission / Potrero / East Bay',
    },
  });

  // 5. Create Food Listings in different lifecycle states
  // Listing 1: AVAILABLE (High urgency, prepared meals)
  const listing1 = await prisma.foodListing.create({
    data: {
      providerId: provider1.id,
      title: 'Roasted Vegetable & Quinoa Grain Bowls',
      description: 'Nutritious chef-prepared grain bowls with roasted squash, bell peppers, quinoa, and lemon-tahini dressing. Packaged individually in compostable containers.',
      category: 'PREPARED_MEALS',
      quantity: 25,
      remainingQuantity: 25,
      unit: 'portions',
      preparedAt: new Date(now.getTime() - 2 * 3600 * 1000),
      expiresAt: new Date(now.getTime() + 6 * 3600 * 1000), // expires in 6 hours (High Urgency)
      pickupStartAt: new Date(now.getTime() - 1 * 3600 * 1000),
      pickupEndAt: new Date(now.getTime() + 5 * 3600 * 1000),
      address: '100 Market St, San Francisco, CA 94105',
      latitude: 37.7938,
      longitude: -122.3956,
      dietaryNotes: 'Vegetarian, Vegan, Gluten-Free, Halal',
      allergenNotes: 'Contains sesame (tahini dressing packaged separately)',
      handlingInstructions: 'Keep refrigerated below 4°C until ready to distribute.',
      safetyConfirmation: true,
      status: 'AVAILABLE',
    },
  });

  // Listing 2: AVAILABLE (Bakery surplus)
  const listing2 = await prisma.foodListing.create({
    data: {
      providerId: provider2.id,
      title: 'Artisan Country Sourdough Loaves & Croissants',
      description: 'End-of-day freshly baked sourdough boules, sesame baguettes, and butter croissants. In clean bakery bags, ideal for shelter breakfast.',
      category: 'BAKERY',
      quantity: 35,
      remainingQuantity: 35,
      unit: 'loaves & pastries',
      preparedAt: new Date(now.getTime() - 5 * 3600 * 1000),
      expiresAt: new Date(now.getTime() + 24 * 3600 * 1000),
      pickupStartAt: new Date(now.getTime() + 1 * 3600 * 1000),
      pickupEndAt: new Date(now.getTime() + 8 * 3600 * 1000),
      address: '2400 Mission St, San Francisco, CA 94110',
      latitude: 37.7588,
      longitude: -122.4191,
      dietaryNotes: 'Vegetarian',
      allergenNotes: 'Contains wheat gluten, dairy (croissants)',
      handlingInstructions: 'Store in dry ambient room temperature.',
      safetyConfirmation: true,
      status: 'AVAILABLE',
    },
  });

  // Listing 3: REQUESTED state with a pending request
  const listing3 = await prisma.foodListing.create({
    data: {
      providerId: provider1.id,
      title: 'Organic Farm Spinach & Mixed Greens Packs',
      description: 'Crisp pre-washed salad mixes from our catering surplus. Packed in temperature-sealed food crates.',
      category: 'PRODUCE',
      quantity: 18,
      remainingQuantity: 18,
      unit: 'crates',
      preparedAt: new Date(now.getTime() - 4 * 3600 * 1000),
      expiresAt: new Date(now.getTime() + 18 * 3600 * 1000),
      pickupStartAt: new Date(now.getTime()),
      pickupEndAt: new Date(now.getTime() + 10 * 3600 * 1000),
      address: '100 Market St, San Francisco, CA 94105',
      latitude: 37.7938,
      longitude: -122.3956,
      dietaryNotes: 'Vegan, 100% Organic',
      allergenNotes: 'None',
      handlingInstructions: 'Refrigerate immediately upon pickup.',
      safetyConfirmation: true,
      status: 'REQUESTED',
    },
  });

  // Request for Listing 3 (PENDING review)
  await prisma.donationRequest.create({
    data: {
      listingId: listing3.id,
      recipientOrganizationId: orgVerified.id,
      requestedQuantity: 12,
      status: 'PENDING',
      requestedAt: new Date(now.getTime() - 45 * 60 * 1000),
    },
  });

  // Listing 4: ACCEPTED & VOLUNTEER_ASSIGNED
  const listing4 = await prisma.foodListing.create({
    data: {
      providerId: provider1.id,
      title: 'Hearty Lentil Stew with Basmati Rice Meals',
      description: 'Freshly prepared slow-cooked spiced lentil soup with fragrant rice. Hot containers ready for courier collection.',
      category: 'PREPARED_MEALS',
      quantity: 30,
      remainingQuantity: 0,
      unit: 'meals',
      preparedAt: new Date(now.getTime() - 3 * 3600 * 1000),
      expiresAt: new Date(now.getTime() + 8 * 3600 * 1000),
      pickupStartAt: new Date(now.getTime() - 30 * 60 * 1000),
      pickupEndAt: new Date(now.getTime() + 3 * 3600 * 1000),
      address: '100 Market St, San Francisco, CA 94105',
      latitude: 37.7938,
      longitude: -122.3956,
      dietaryNotes: 'Vegan, Halal, Gluten-Free',
      allergenNotes: 'None',
      handlingInstructions: 'Maintain thermal carrier insulation during transit.',
      safetyConfirmation: true,
      status: 'VOLUNTEER_ASSIGNED',
    },
  });

  const request4 = await prisma.donationRequest.create({
    data: {
      listingId: listing4.id,
      recipientOrganizationId: orgVerified.id,
      requestedQuantity: 30,
      acceptedQuantity: 30,
      status: 'ACCEPTED',
      requestedAt: new Date(now.getTime() - 2 * 3600 * 1000),
      respondedAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
  });

  await prisma.volunteerAssignment.create({
    data: {
      donationRequestId: request4.id,
      volunteerId: volunteer1.id,
      status: 'ASSIGNED',
      assignedAt: new Date(now.getTime() - 60 * 60 * 1000),
      pickupNotes: 'Using insulated cargo bag on electric bike.',
    },
  });

  // Listing 5: PICKED_UP (In transit)
  const listing5 = await prisma.foodListing.create({
    data: {
      providerId: provider2.id,
      title: 'Whole Grain Bagels & Cream Cheese Tubs',
      description: 'Assorted artisan bagels (sesame, plain, everything) plus sealed commercial cream cheese packs.',
      category: 'BAKERY',
      quantity: 50,
      remainingQuantity: 0,
      unit: 'bagels',
      preparedAt: new Date(now.getTime() - 6 * 3600 * 1000),
      expiresAt: new Date(now.getTime() + 16 * 3600 * 1000),
      pickupStartAt: new Date(now.getTime() - 2 * 3600 * 1000),
      pickupEndAt: new Date(now.getTime() + 2 * 3600 * 1000),
      address: '2400 Mission St, San Francisco, CA 94110',
      latitude: 37.7588,
      longitude: -122.4191,
      dietaryNotes: 'Vegetarian',
      allergenNotes: 'Contains wheat, dairy, sesame seeds',
      safetyConfirmation: true,
      status: 'PICKED_UP',
    },
  });

  const request5 = await prisma.donationRequest.create({
    data: {
      listingId: listing5.id,
      recipientOrganizationId: orgVerified.id,
      requestedQuantity: 50,
      acceptedQuantity: 50,
      status: 'ACCEPTED',
      requestedAt: new Date(now.getTime() - 3 * 3600 * 1000),
      respondedAt: new Date(now.getTime() - 2.5 * 3600 * 1000),
    },
  });

  await prisma.volunteerAssignment.create({
    data: {
      donationRequestId: request5.id,
      volunteerId: volunteer2.id,
      status: 'PICKED_UP',
      assignedAt: new Date(now.getTime() - 2 * 3600 * 1000),
      pickedUpAt: new Date(now.getTime() - 25 * 60 * 1000),
      pickupNotes: 'Picked up from bakery front desk. Verified safe packaging.',
    },
  });

  // Listing 6: COMPLETED (Delivered and confirmed)
  const listing6 = await prisma.foodListing.create({
    data: {
      providerId: provider1.id,
      title: 'Chilled Greek Yogurt & Berry Compote Parfaits',
      description: 'Breakfast parfaits with vanilla Greek yogurt, chia berry jam, and almond granola on the side.',
      category: 'DAIRY',
      quantity: 40,
      remainingQuantity: 0,
      unit: 'cups',
      preparedAt: new Date(now.getTime() - 28 * 3600 * 1000),
      expiresAt: new Date(now.getTime() - 2 * 3600 * 1000),
      pickupStartAt: new Date(now.getTime() - 24 * 3600 * 1000),
      pickupEndAt: new Date(now.getTime() - 20 * 3600 * 1000),
      address: '100 Market St, San Francisco, CA 94105',
      latitude: 37.7938,
      longitude: -122.3956,
      dietaryNotes: 'Vegetarian',
      allergenNotes: 'Contains milk, tree nuts (almonds)',
      safetyConfirmation: true,
      status: 'COMPLETED',
    },
  });

  const request6 = await prisma.donationRequest.create({
    data: {
      listingId: listing6.id,
      recipientOrganizationId: orgVerified.id,
      requestedQuantity: 40,
      acceptedQuantity: 40,
      status: 'COMPLETED',
      requestedAt: new Date(now.getTime() - 24 * 3600 * 1000),
      respondedAt: new Date(now.getTime() - 23 * 3600 * 1000),
    },
  });

  await prisma.volunteerAssignment.create({
    data: {
      donationRequestId: request6.id,
      volunteerId: volunteer1.id,
      status: 'DELIVERED',
      assignedAt: new Date(now.getTime() - 22 * 3600 * 1000),
      pickedUpAt: new Date(now.getTime() - 21 * 3600 * 1000),
      deliveredAt: new Date(now.getTime() - 20 * 3600 * 1000),
      pickupNotes: 'Picked up from cold storage.',
      deliveryNotes: 'Delivered directly to community shelter kitchen supervisor.',
    },
  });

  // 6. Create In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: recipientUser1.id,
        type: 'REQUEST_ACCEPTED',
        title: 'Donation Request Accepted!',
        message: 'Your request for 30 meals of Hearty Lentil Stew was approved.',
        relatedEntityType: 'DonationRequest',
        relatedEntityId: request4.id,
        createdAt: new Date(now.getTime() - 90 * 60 * 1000),
      },
      {
        userId: recipientUser1.id,
        type: 'PICKUP_COMPLETED',
        title: 'Food Picked Up by Volunteer',
        message: 'Maya Patel has collected your bagel donation and is en route.',
        relatedEntityType: 'VolunteerAssignment',
        relatedEntityId: request5.id,
        createdAt: new Date(now.getTime() - 20 * 60 * 1000),
      },
      {
        userId: provider1.id,
        type: 'REQUEST_RECEIVED',
        title: 'New Donation Request',
        message: 'Hope Community Kitchen requested 12 crates of spinach and greens.',
        relatedEntityType: 'DonationRequest',
        relatedEntityId: listing3.id,
        createdAt: new Date(now.getTime() - 40 * 60 * 1000),
      },
      {
        userId: admin.id,
        type: 'VERIFICATION_REQUESTED',
        title: 'Organization Verification Pending',
        message: 'Northside Youth Nutrition Project has applied for platform verification.',
        relatedEntityType: 'Organization',
        relatedEntityId: orgPending.id,
        createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      },
    ],
  });

  // 7. Create Audit Log Entries
  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: admin.id,
        action: 'ORGANIZATION_VERIFIED',
        entityType: 'Organization',
        entityId: orgVerified.id,
        metadata: JSON.stringify({ organization: orgVerified.name, status: 'VERIFIED' }),
        createdAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
      },
      {
        actorUserId: provider1.id,
        action: 'LISTING_CREATED',
        entityType: 'FoodListing',
        entityId: listing1.id,
        metadata: JSON.stringify({ title: listing1.title, quantity: 25, unit: 'portions' }),
        createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      },
      {
        actorUserId: provider1.id,
        action: 'REQUEST_ACCEPTED',
        entityType: 'DonationRequest',
        entityId: request4.id,
        metadata: JSON.stringify({ acceptedQuantity: 30, remainingQuantity: 0 }),
        createdAt: new Date(now.getTime() - 90 * 60 * 1000),
      },
      {
        actorUserId: volunteer1.id,
        action: 'VOLUNTEER_DELIVERED',
        entityType: 'VolunteerAssignment',
        entityId: request6.id,
        metadata: JSON.stringify({ notes: 'Delivered directly to community kitchen' }),
        createdAt: new Date(now.getTime() - 20 * 3600 * 1000),
      },
    ],
  });

  console.log('✅ Demo Seed Data successfully created!');
  console.log('📋 Demo Credentials:');
  console.log(' - Admin: admin@foodloop.org / Password123!');
  console.log(' - Provider 1: bistro@foodloop.org / Password123!');
  console.log(' - Provider 2: bakery@foodloop.org / Password123!');
  console.log(' - Recipient (Verified): shelter@foodloop.org / Password123!');
  console.log(' - Recipient (Pending): youth@foodloop.org / Password123!');
  console.log(' - Volunteer 1: alex.volunteer@foodloop.org / Password123!');
  console.log(' - Volunteer 2: maya.volunteer@foodloop.org / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
