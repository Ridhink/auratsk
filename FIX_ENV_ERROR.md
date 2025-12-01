# Fix .env.local Syntax Error

## Error Message
```
Error [SyntaxError]: Unexpected end of input
```

This usually means your `.env.local` file has:
- An unclosed quote
- An incomplete value
- A missing equals sign
- Special characters that need escaping

## Quick Fix

1. **Check your `.env.local` file** - Make sure every line with a value has:
   ```bash
   KEY=value
   ```

2. **No quotes needed** (unless value has spaces):
   ```bash
   # ✅ Correct
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   
   # ❌ Wrong (unclosed quote)
   DATABASE_URL="postgresql://user:pass@localhost:5432/db
   ```

3. **If value has spaces, use quotes:**
   ```bash
   # ✅ Correct
   SOME_KEY="value with spaces"
   ```

4. **Check for incomplete lines:**
   ```bash
   # ❌ Wrong (incomplete)
   DATABASE_URL=
   
   # ✅ Correct
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   ```

## Common Issues

### Issue 1: Unclosed Quote
```bash
# ❌ Wrong
DATABASE_URL="postgresql://user:pass@localhost:5432/db

# ✅ Correct
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### Issue 2: Special Characters in Password
If your password has special characters, URL-encode them:
```bash
# Password: p@ssw0rd
# ❌ Wrong
DATABASE_URL=postgresql://user:p@ssw0rd@localhost:5432/db

# ✅ Correct
DATABASE_URL=postgresql://user:p%40ssw0rd@localhost:5432/db
```

### Issue 3: Incomplete File
Make sure your `.env.local` file ends properly (no trailing backslash or incomplete line).

## Quick Test

Create a minimal `.env.local` to test:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auratask
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_test
CLERK_SECRET_KEY=sk_test_test
WEBHOOK_SECRET=whsec_test
GEMINI_API_KEY=test
BREVO_API_KEY=test
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

If this works, gradually add your real values.

## Solution

1. **Backup your current `.env.local`:**
   ```bash
   cp .env.local .env.local.backup
   ```

2. **Create a fresh one** using `env.template`:
   ```bash
   cp env.template .env.local
   ```

3. **Fill in your actual values** (one at a time, test after each)

4. **Restart your dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

