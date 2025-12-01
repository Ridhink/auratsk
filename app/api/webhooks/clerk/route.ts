import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { syncClerkUser, syncClerkOrganization } from '@/lib/auth/clerk';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // User will be created when they join an organization
    // For now, we'll just log it
    console.log('User created:', id);
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // Update user in database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, id),
    });

    if (existingUser) {
      await db
        .update(users)
        .set({
          name: `${first_name || ''} ${last_name || ''}`.trim() || email_addresses[0]?.email_address || existingUser.name,
          email: email_addresses[0]?.email_address || existingUser.email,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, id));
    }
  }

  if (eventType === 'organization.created') {
    const { id, name } = evt.data;
    await syncClerkOrganization(id, { name });
  }

  if (eventType === 'organizationMembership.created') {
    const { organization, public_user_data } = evt.data;
    
    // Get or create organization
    const org = await syncClerkOrganization(organization.id, organization);
    
    if (org) {
      // Create user in database
      const existingUser = await db.query.users.findFirst({
        where: eq(users.clerkId, public_user_data.user_id),
      });

      if (!existingUser) {
        await db.insert(users).values({
          clerkId: public_user_data.user_id,
          name: `${public_user_data.first_name || ''} ${public_user_data.last_name || ''}`.trim() || 'User',
          email: public_user_data.identifier || '',
          organizationId: org.id,
          role: 'MEMBER',
          tasksCount: 0,
        });
      } else {
        // Update organization if user already exists
        await db
          .update(users)
          .set({
            organizationId: org.id,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, public_user_data.user_id));
      }
    }
  }

  return new Response('', { status: 200 });
}

