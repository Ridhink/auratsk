# Routes and Headers Documentation

## Application Routes

### Public Routes (No Authentication Required)

1. **`/`** (Home)
   - Redirects to `/dashboard`
   - No header needed (redirects immediately)

2. **`/sign-in`**
   - Clerk authentication page
   - **Layout**: `app/sign-in/layout.tsx`
   - **Header**: ✅ Yes (via layout)

3. **`/sign-up`**
   - Clerk authentication page
   - **Layout**: `app/sign-up/layout.tsx`
   - **Header**: ✅ Yes (via layout)

4. **`/invite/[token]`**
   - Invite acceptance page
   - **Layout**: `app/invite/layout.tsx`
   - **Header**: ✅ Yes (via layout)
   - **Note**: Public route (users may not be signed in yet)

### Protected Routes (Authentication Required)

1. **`/dashboard`**
   - Main task board and AI chat
   - **Layout**: `app/dashboard/layout.tsx`
   - **Header**: ✅ Yes (via layout)
   - **Features**: 
     - Trial banner (if active)
     - User and organization info in header
     - Navigation links

2. **`/members`**
   - Team members and performance metrics
   - **Layout**: `app/members/layout.tsx`
   - **Header**: ✅ Yes (via layout)
   - **Features**:
     - Invite member button (for Admins/Managers)
     - Pending invites display
     - Member cards with metrics

## Layout Structure

### Root Layout (`app/layout.tsx`)
- Wraps entire application
- Provides ClerkProvider
- Provides ToastProvider
- Sets global styles and fonts

### Page-Specific Layouts

#### Dashboard Layout (`app/dashboard/layout.tsx`)
```tsx
- Fetches user and organization data
- Displays Header with user/org info
- Shows trial banner if active
- Dark theme background
```

#### Members Layout (`app/members/layout.tsx`)
```tsx
- Fetches user and organization data
- Displays Header with user/org info
- Dark theme background
```

#### Invite Layout (`app/invite/layout.tsx`)
```tsx
- Displays Header (no user data required)
- Dark theme background
- Centered content area
```

#### Sign-In Layout (`app/sign-in/layout.tsx`)
```tsx
- Displays Header
- Centers Clerk sign-in component
- Dark theme background
```

#### Sign-Up Layout (`app/sign-up/layout.tsx`)
```tsx
- Displays Header
- Centers Clerk sign-up component
- Dark theme background
```

## Header Component

**Location**: `components/layout/Header.tsx`

**Features**:
- Logo and branding (AuraTask)
- Navigation links (Dashboard, Members)
- User information display
- Organization name display
- Theme toggle
- Clerk UserButton
- Mobile navigation menu
- Responsive design

**Props**:
- `userName?: string` - Optional user name
- `organizationName?: string` - Optional organization name

**Behavior**:
- If props not provided, fetches from Clerk user data
- Shows active route highlighting
- Mobile-friendly with hamburger menu

## Navigation Structure

### Desktop Navigation
- Dashboard link (📋)
- Members link (👥)
- Active route highlighted with purple accent

### Mobile Navigation
- Hamburger menu
- Slide-down menu with all links
- User info and theme toggle

## Route Protection

**Middleware**: `middleware.ts`

**Public Routes**:
- `/sign-in(.*)`
- `/sign-up(.*)`
- `/`
- `/invite(.*)`

**Protected Routes** (All others):
- Require authentication
- Redirect to sign-in if not authenticated

## API Routes

### `/api/ai/task-assistant`
- POST endpoint for AI chat
- Protected (requires auth)

### `/api/invites`
- GET endpoint for invites
- Returns all invites for organization (if no token)
- Returns specific invite (if token provided)
- Protected (requires auth)

### `/api/user`
- GET endpoint for current user
- Returns user and organization data
- Protected (requires auth)

### `/api/webhooks/clerk`
- POST endpoint for Clerk webhooks
- Public (Clerk calls this)
- Syncs user/organization data

## Page Flow

1. **Unauthenticated User**:
   - `/` → Redirects to `/dashboard` → Redirects to `/sign-in`
   - `/sign-in` → Shows sign-in page with header
   - `/invite/[token]` → Shows invite page with header

2. **Authenticated User**:
   - `/` → Redirects to `/dashboard`
   - `/dashboard` → Shows dashboard with header and trial banner
   - `/members` → Shows members page with header
   - `/invite/[token]` → Shows invite acceptance page with header

## Styling

All pages use consistent styling:
- Background: `bg-gray-950 dark:bg-[#171725]`
- Text: `text-white`
- Header: Sticky, with backdrop blur
- Borders: Purple accent (`border-purple-500/20`)
- Responsive: Mobile-first design

## Future Routes (Potential)

- `/settings` - Organization settings
- `/profile` - User profile
- `/analytics` - Task analytics
- `/reports` - Performance reports
- `/integrations` - Third-party integrations

