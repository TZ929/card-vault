import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from 'db'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response('Error: No email address found for new user', { status: 400 });
    }

    // Create user in your own database
    const user = await db.user.create({
      data: {
        clerkId: id,
        email: email,
        role: 'BUYER', // Default role
      },
    });

    // Add role to user's public metadata in Clerk
    await clerkClient.users.updateUserMetadata(id, {
      publicMetadata: {
        role: user.role,
      },
    });
  }

  return new Response('', { status: 200 })
} 