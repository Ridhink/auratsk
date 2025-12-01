import { auth, currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Find user in database
  let userResult;
  try {
    userResult = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);
  } catch (error) {
    console.error('Database query error in getCurrentUser:', error);
    // If database error, return null and let the auto-creation handle it
    userResult = [];
  }

  let userRecord = userResult[0];

  // If user doesn't exist, try to create them
  // This can happen if webhook hasn't fired yet
  if (!userRecord) {
    let organizationId: string;

    try {
      // Get user's organization memberships from Clerk
      const clerk = await clerkClient();
      const orgMemberships = await clerk.users.getOrganizationMembershipList({
        userId,
      });

      // If user has organization memberships, get the first one
      if (orgMemberships.data && orgMemberships.data.length > 0) {
        const firstOrg = orgMemberships.data[0].organization;
        const clerkOrgId = firstOrg.id;

        // Find or create organization in database
        let orgResult = await db
          .select()
          .from(organizations)
          .where(eq(organizations.clerkOrganizationId, clerkOrgId))
          .limit(1);

        if (!orgResult[0]) {
          // Create organization if it doesn't exist
          const trialStartDate = new Date();
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 20);

          const [newOrg] = await db
            .insert(organizations)
            .values({
              name: firstOrg.name || 'My Organization',
              clerkOrganizationId: clerkOrgId,
              subscriptionStatus: 'TRIAL',
              trialStartDate,
              trialEndDate,
              plan: 'FREE_TRIAL',
            })
            .returning();

          organizationId = newOrg.id;
        } else {
          organizationId = orgResult[0].id;
        }
      } else {
        // User has no organization - create a default one
        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 20);

        const [newOrg] = await db
          .insert(organizations)
          .values({
            name: `${clerkUser.firstName || 'User'}'s Organization`,
            clerkOrganizationId: `temp_${userId}`, // Temporary ID
            subscriptionStatus: 'TRIAL',
            trialStartDate,
            trialEndDate,
            plan: 'FREE_TRIAL',
          })
          .returning();

        organizationId = newOrg.id;
      }
    } catch (error) {
      // Fallback: create a default organization if Clerk API fails
      console.error('Error getting organization from Clerk:', error);
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 20);

      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: `${clerkUser.firstName || 'User'}'s Organization`,
          clerkOrganizationId: `temp_${userId}`,
          subscriptionStatus: 'TRIAL',
          trialStartDate,
          trialEndDate,
          plan: 'FREE_TRIAL',
        })
        .returning();

      organizationId = newOrg.id;
    }

    // Determine user role: 
    // - If this is a new organization (just created), user is ADMIN
    // - If joining via invite, role will be set by invite acceptance
    // - For direct sign-ups (not via invite), first user in org = ADMIN
    let userRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE';
    
    // Check if this organization has any other users
    const existingOrgUsers = await db
      .select()
      .from(users)
      .where(eq(users.organizationId, organizationId))
      .limit(1);
    
    // If no users exist in this org, this is the first user = ADMIN
    // This ensures that when someone signs up directly (not via invite), they become ADMIN
    if (existingOrgUsers.length === 0) {
      userRole = 'ADMIN';
    } else {
      // If organization already has users, this sign-up should be via invite
      // If not via invite, throw error (employees/managers can't sign up directly)
      // For now, we'll default to EMPLOYEE but this should be handled by invite flow
      // In production, you might want to redirect to invite-only signup
      userRole = 'EMPLOYEE';
    }

    // Create user record
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: userId,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.emailAddresses[0]?.emailAddress || 'User',
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        organizationId: organizationId,
        role: userRole,
        tasksCount: 0,
      })
      .returning();
    
    userRecord = newUser;
  }

  // Get organization if user has one
  let orgRecord = null;
  if (userRecord.organizationId) {
    const orgResult = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, userRecord.organizationId))
      .limit(1);
    
    orgRecord = orgResult[0] || null;
  }

  return {
    ...userRecord,
    organization: orgRecord,
  };
}

export async function getCurrentOrganization() {
  const user = await getCurrentUser();
  if (!user) return null;

  return user.organization;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

export async function requireOrganization() {
  const org = await getCurrentOrganization();
  if (!org) {
    throw new Error('No organization found');
  }
  return org;
}

// Sync Clerk user with database
export async function syncClerkUser(clerkUserId: string, clerkUser: any) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);
  
  const user = existingUser[0];

  if (user) {
    // Update existing user
    await db
      .update(users)
      .set({
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.emailAddresses[0]?.emailAddress || 'User',
        email: clerkUser.emailAddresses[0]?.emailAddress || existingUser.email,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUserId));
    return user;
  }

  // Create new user - will need organization context
  // This should be handled in a webhook or during organization creation
  return null;
}

// Sync Clerk organization with database
export async function syncClerkOrganization(clerkOrgId: string, clerkOrg: any) {
  const existingOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.clerkOrganizationId, clerkOrgId))
    .limit(1);
  
  const org = existingOrg[0];

  if (org) {
    return org;
  }

  // Create new organization with 20-day trial
  const trialStartDate = new Date();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 20);

  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: clerkOrg.name || 'My Organization',
      clerkOrganizationId: clerkOrgId,
      subscriptionStatus: 'TRIAL',
      trialStartDate,
      trialEndDate,
      plan: 'FREE_TRIAL',
    })
    .returning();

  return newOrg;
}

