# Quick Connection Guide

## 1. Get Your Database Info from pgAdmin

When you connect to your database in pgAdmin, note:
- **Database name**: (e.g., `auratask`, `mydb`, etc.)
- **Username**: (e.g., `postgres`)
- **Password**: (if you set one)
- **Host**: Usually `localhost`
- **Port**: Usually `5432`

## 2. Create .env.local File

In your project root, create `.env.local`:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

**Example:**
```bash
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/auratask
```

## 3. Push Schema

```bash
npm run db:push
```

## 4. Test

```bash
npm run db:studio
```

If it opens and shows your database, you're connected! ✅

## Done!

Now run your app:
```bash
npm run dev
```

