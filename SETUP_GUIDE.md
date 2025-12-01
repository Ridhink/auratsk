# AuraTask Setup Guide

## Prerequisites

1. **PostgreSQL Database**
   - Local: Install PostgreSQL locally or use Docker
   - Cloud: Use Vercel Postgres, Supabase, Railway, or Neon

2. **Clerk Account**
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Enable Organizations

3. **Google Gemini API Key**
   - Get from [Google AI Studio](https://aistudio.google.com/apikey)

4. **Brevo Account** (for emails)
   - Sign up at [brevo.com](https://www.brevo.com)
   - Get your API key from Settings > API Keys

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/auratask

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
WEBHOOK_SECRET=whsec_...

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Brevo Email
BREVO_API_KEY=your_brevo_api_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Clerk

1. Go to your Clerk Dashboard
2. Navigate to **Webhooks**
3. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Select events:
   - `user.created`
   - `user.updated`
   - `organization.created`
   - `organizationMembership.created`
5. Copy the **Signing Secret** to `WEBHOOK_SECRET` in `.env.local`

### 4. Set Up Database

#### Option A: Generate and Run Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

#### Option B: Push Schema Directly (Development)

```bash
# Push schema directly to database (for development)
npm run db:push
```

#### Option C: Use Drizzle Studio (Visual)

```bash
# Open Drizzle Studio to view and manage database
npm run db:studio
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## First-Time Setup Flow

1. **Sign Up**: Create an account at `/sign-up`
2. **Create Organization**: Clerk will prompt you to create an organization
3. **Database Sync**: The webhook will automatically:
   - Create organization record in database
   - Create user record linked to organization
   - Set up 20-day trial period

## Database Schema

The application uses the following main tables:

- `organizations` - Organization/tenant data
- `users` - User accounts linked to organizations
- `tasks` - Task management
- `performance_metrics` - Performance tracking

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database exists: `CREATE DATABASE auratask;`

### Clerk Authentication Issues

- Verify all Clerk keys are set correctly
- Check webhook endpoint is accessible
- Ensure webhook secret matches in Clerk dashboard

### Email Not Sending

- Verify `BREVO_API_KEY` is set
- Check Brevo account has sending credits
- Emails will log to console if Brevo is not configured

### AI Not Working

- Verify `GEMINI_API_KEY` is set
- Check API key has quota remaining
- Review API route logs for errors

## Production Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Set up Vercel Postgres (or use external database)
5. Update Clerk webhook URL to production domain
6. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- `BREVO_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## Next Steps

- Customize email templates in Brevo dashboard
- Set up subscription management (Stripe integration)
- Configure custom domain
- Set up error monitoring (Sentry)
- Add analytics

