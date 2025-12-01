import { db } from './index';
import { invites } from './schema';
import { eq, and } from 'drizzle-orm';
import type { Invite } from './schema';

// Generate unique invite token
export function generateInviteToken(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

// Create invite
export async function createInviteRecord(
  organizationId: string,
  email: string,
  role: 'MANAGER' | 'EMPLOYEE',
  invitedById: string
): Promise<Invite> {
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const [invite] = await db
    .insert(invites)
    .values({
      organizationId,
      email,
      role: role as 'MANAGER' | 'EMPLOYEE',
      token,
      invitedById,
      expiresAt,
      used: false,
    })
    .returning();

  return invite;
}

// Get invite by token
export async function getInviteByToken(token: string): Promise<Invite | null> {
  const result = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.token, token),
        eq(invites.used, false)
      )
    )
    .limit(1);

  if (!result[0]) return null;

  // Check if expired
  if (new Date() > new Date(result[0].expiresAt)) {
    return null;
  }

  return result[0];
}

// Mark invite as used
export async function markInviteAsUsed(token: string): Promise<void> {
  await db
    .update(invites)
    .set({ used: true })
    .where(eq(invites.token, token));
}

// Get all invites for organization
export async function getInvitesForOrganization(organizationId: string): Promise<Invite[]> {
  return await db
    .select()
    .from(invites)
    .where(eq(invites.organizationId, organizationId))
    .orderBy((invites, { desc }) => [desc(invites.createdAt)]);
}
