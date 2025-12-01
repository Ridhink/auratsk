# How to Invite New Users to AuraTask

## Quick Guide

### Step 1: Navigate to Members Page
1. Log in to your AuraTask account
2. Click on **"Members"** in the navigation menu (or go to `/members`)

### Step 2: Click "Invite Member" Button
- You'll see an **"Invite Member"** button in the top-right corner of the Members page
- This button is only visible if you have permission to invite users:
  - **Admins/Owners**: Can invite both Managers and Employees
  - **Managers**: Can only invite Employees

### Step 3: Fill in Invite Details
1. **Email Address**: Enter the email address of the person you want to invite
2. **Role**: Select the role:
   - **Manager**: Can invite employees and manage tasks
   - **Employee**: Can view and update assigned tasks
   - *Note: Only Admins can invite Managers*

### Step 4: Send Invite
- Click **"Send Invite"** button
- The system will:
  - Generate a unique invite link
  - Send an email to the invited user
  - Create a pending invite record

### Step 5: User Accepts Invite
1. The invited user receives an email with an invite link
2. They click the link (or copy/paste it into their browser)
3. If not signed in, they'll be prompted to sign in or sign up
4. After signing in, they see the invite details
5. They click **"Accept Invitation"**
6. They're automatically added to your organization with the specified role

## Detailed Instructions

### Who Can Invite Users?

| Role | Can Invite Managers | Can Invite Employees |
|------|-------------------|---------------------|
| **Owner** | ✅ Yes | ✅ Yes |
| **Admin** | ✅ Yes | ✅ Yes |
| **Manager** | ❌ No | ✅ Yes |
| **Employee** | ❌ No | ❌ No |

### Invite Process Flow

```
Admin/Manager clicks "Invite Member"
    ↓
Enters email and selects role
    ↓
System generates unique invite token
    ↓
Email sent to invited user
    ↓
User clicks invite link
    ↓
User signs in (if needed)
    ↓
User accepts invitation
    ↓
User added to organization
    ↓
Welcome email sent
```

### Invite Email Contents

The invite email includes:
- Inviter's name
- Organization name
- Role being invited for
- Invite link (expires in 7 days)
- Instructions to accept

### Invite Link Format

```
https://yourapp.com/invite/{unique-token}
```

Example:
```
https://auratask.com/invite/inv_1234567890_abc123def456
```

### Invite Expiration

- Invites expire after **7 days**
- Expired invites cannot be accepted
- You can see pending invites on the Members page

### Viewing Pending Invites

On the Members page, you'll see a **"Pending Invitations"** section showing:
- Email address
- Role
- Expiration date
- Status (Pending)

### Troubleshooting

#### "You do not have permission to invite users"
- **Solution**: Only Admins, Owners, and Managers can invite users
- Managers can only invite Employees, not other Managers

#### "Only Admins can invite Managers"
- **Solution**: If you're a Manager trying to invite a Manager, you need Admin privileges
- Contact your organization's Admin to invite Managers

#### "User already exists in this organization"
- **Solution**: The email address is already associated with your organization
- Check the Members page to see if they're already a member

#### "Invalid or expired invite"
- **Solution**: The invite link has expired (after 7 days)
- Create a new invite for the user

#### Invite email not received
- **Solution**: 
  1. Check spam/junk folder
  2. Verify email address is correct
  3. Check if BREVO_API_KEY is configured in environment variables
  4. If email service is not configured, the invite link will be shown in a toast notification

### Best Practices

1. **Verify Email Addresses**: Double-check email addresses before sending invites
2. **Choose Appropriate Roles**: Assign roles based on responsibilities
3. **Follow Up**: If user doesn't accept within a few days, follow up
4. **Resend if Needed**: If invite expires, simply create a new one
5. **Bulk Invites**: Currently, invites must be sent one at a time

### API/Technical Details

#### Creating Invites Programmatically

If you need to create invites via API:

```typescript
import { createInvite } from '@/lib/db/actions';

const { invite, inviteLink } = await createInvite(
  'user@example.com',
  'EMPLOYEE' // or 'MANAGER'
);
```

#### Checking Invite Status

```typescript
import { getInvites } from '@/lib/db/actions';

const invites = await getInvites();
const pendingInvites = invites.filter(i => !i.used);
```

## Visual Guide

### Members Page Layout

```
┌─────────────────────────────────────────┐
│  Header (Navigation, User Info)         │
├─────────────────────────────────────────┤
│  Team Members                           │
│  [Invite Member] ← Click here           │
├─────────────────────────────────────────┤
│  Pending Invitations (if any)           │
│  - user@example.com (Manager)           │
│    Expires: Jan 15, 2025                │
├─────────────────────────────────────────┤
│  Member Cards                           │
│  [Member 1] [Member 2] [Member 3]      │
└─────────────────────────────────────────┘
```

### Invite Modal

```
┌─────────────────────────────────────┐
│  Invite Team Member          [X]    │
├─────────────────────────────────────┤
│  Email *                            │
│  [colleague@example.com]           │
│                                     │
│  Role *                             │
│  [Employee ▼]                      │
│  Only Admins can invite Managers    │
│                                     │
│  [Cancel]  [Send Invite]            │
└─────────────────────────────────────┘
```

## Frequently Asked Questions

**Q: Can I invite multiple users at once?**
A: Currently, invites must be sent one at a time. Bulk invite functionality may be added in the future.

**Q: What happens if I invite someone who already has an account?**
A: They can still accept the invite and will be added to your organization. They'll use their existing account.

**Q: Can I cancel or revoke an invite?**
A: Currently, invites cannot be cancelled once sent, but they expire after 7 days. You can see pending invites on the Members page.

**Q: What if the user doesn't receive the email?**
A: The invite link is also shown in a toast notification when you create the invite. You can copy and share it manually.

**Q: Can I change a user's role after inviting them?**
A: Role changes after invitation would need to be done through database updates or a future admin interface.

**Q: How do I know if someone accepted my invite?**
A: Once accepted, the invite will no longer appear in "Pending Invitations" and the user will appear in the Members list.

## Support

If you encounter any issues with the invite system:
1. Check that you have the correct permissions
2. Verify your email service (Brevo) is configured
3. Check the browser console for errors
4. Ensure the invite hasn't expired

