# Clerk Webhook Setup Guide

## What is WEBHOOK_SECRET?

The `WEBHOOK_SECRET` is used to verify that webhook requests are actually coming from Clerk (security feature). It's required for the webhook endpoint at `/api/webhooks/clerk/route.ts` to work.

## Step-by-Step Setup

### Option 1: Set Up Webhook (Recommended for Production)

1. **Go to Clerk Dashboard**
   - Visit: https://dashboard.clerk.com
   - Sign in to your account

2. **Navigate to Webhooks**
   - Click on your application
   - Go to **Webhooks** in the left sidebar

3. **Add Endpoint**
   - Click **"Add Endpoint"** or **"Create Endpoint"**
   - Enter your webhook URL:
     - **Development**: `http://localhost:3000/api/webhooks/clerk`
     - **Production**: `https://yourdomain.com/api/webhooks/clerk`
   - Click **"Create"**

4. **Select Events**
   - Check these events:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `organization.created`
     - ✅ `organizationMembership.created`

5. **Copy the Signing Secret**
   - After creating the endpoint, you'll see a **"Signing Secret"**
   - It starts with `whsec_`
   - Click **"Copy"** or **"Reveal"** to see it

6. **Add to .env.local**
   ```bash
   WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

### Option 2: Skip Webhook for Development (Quick Start)

If you're just testing locally and don't want to set up webhooks yet:

1. **Use a placeholder value** (webhook won't work, but app will run):
   ```bash
   WEBHOOK_SECRET=whsec_placeholder_for_development
   ```

2. **The app will still work** because:
   - Users are auto-created when they first log in (fallback in `getCurrentUser()`)
   - You can manually create users/organizations if needed

3. **Set up webhook later** when you're ready for production

## For Your Current Setup

Since you're developing locally, you have two options:

### Quick Start (Skip Webhook)
```bash
WEBHOOK_SECRET=whsec_development_placeholder
```

This lets you test the app immediately. Users will be auto-created on first login.

### Full Setup (Recommended)
1. Set up the webhook in Clerk Dashboard (steps above)
2. Use the real secret from Clerk
3. Webhooks will automatically sync users/organizations

## Testing Webhook Locally

If you want to test webhooks locally, you'll need:

1. **ngrok or similar tool** to expose localhost:
   ```bash
   npx ngrok http 3000
   ```

2. **Use the ngrok URL** in Clerk webhook endpoint:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/clerk
   ```

3. **Copy the signing secret** to `.env.local`

## Current Status

Based on your code, the app has a **fallback mechanism**:
- If webhook hasn't created user → Auto-creates on first login
- If webhook hasn't created org → Auto-creates default org

So you can start with a placeholder and set up the real webhook later!

## Recommendation

**For now (development):**
```bash
WEBHOOK_SECRET=whsec_development_placeholder
```

**Later (production):**
- Set up webhook in Clerk Dashboard
- Use the real signing secret
- This ensures automatic sync of users/organizations

