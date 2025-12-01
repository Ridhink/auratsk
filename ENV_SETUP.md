# Environment Variables Setup Guide

## Quick Start

1. **Copy the template file:**
   ```bash
   cp env.template .env.local
   ```

2. **Open `.env.local` and replace all placeholder values with your actual credentials**

3. **That's it!** Your app will automatically load these variables.

## Required Variables

### 1. Database (PostgreSQL)
```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
```

**How to get:**
- From pgAdmin: Right-click your database → Properties
- Username: Your PostgreSQL username (often `postgres`)
- Password: Your PostgreSQL password
- Host: Usually `localhost`
- Port: Usually `5432`
- Database: The name you created in pgAdmin

**Example:**
```bash
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/auratask
```

### 2. Clerk Authentication

Get from: https://dashboard.clerk.com

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
WEBHOOK_SECRET=whsec_...
```

**Steps:**
1. Sign up/login to Clerk
2. Create a new application
3. Go to **API Keys** → Copy Publishable Key and Secret Key
4. Go to **Webhooks** → Create endpoint → Copy Signing Secret

### 3. Gemini AI

Get from: https://aistudio.google.com/apikey

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Brevo Email

Get from: https://www.brevo.com

```bash
BREVO_API_KEY=your_brevo_api_key_here
```

**Steps:**
1. Sign up/login to Brevo
2. Go to **Settings** → **API Keys**
3. Create a new API key
4. Copy it here

### 5. App URL

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, change to your domain:
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Complete Example

Here's what a complete `.env.local` file looks like:

```bash
# Database
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/auratask

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_51AbC123...
CLERK_SECRET_KEY=sk_test_xyz789...
WEBHOOK_SECRET=whsec_abc123...

# Gemini
GEMINI_API_KEY=AIzaSyAbC123...

# Brevo
BREVO_API_KEY=xkeysib-abc123...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Verification

After setting up, test your connection:

```bash
# Test database connection
npm run db:studio

# Start the app
npm run dev
```

## Security Notes

- ✅ `.env.local` is already in `.gitignore` - it won't be committed
- ✅ Never share your `.env.local` file
- ✅ Use different keys for development and production
- ✅ The `env.template` file is safe to commit (no real secrets)

## Troubleshooting

### "DATABASE_URL is not set"
- Make sure you created `.env.local` (not just `.env`)
- Check the file is in the project root directory
- Restart your dev server after creating the file

### "Invalid connection string"
- Check for typos in username, password, or database name
- Make sure there are no extra spaces
- URL-encode special characters in password (e.g., `@` → `%40`)

### "Clerk authentication failed"
- Verify all three Clerk keys are set correctly
- Make sure you're using test keys (pk_test_/sk_test_) for development

