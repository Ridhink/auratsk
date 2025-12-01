# Role-Based Access Control & Invite System

## Overview

AuraTask now includes a comprehensive role-based access control system with invite functionality, email notifications, and enhanced task management features.

## User Roles

### 1. **OWNER**
- Full system access
- Can invite Managers and Employees
- Can manage all tasks and members
- Can view all performance metrics

### 2. **ADMIN**
- Full system access (except organization settings)
- Can invite Managers and Employees
- Can manage all tasks and members
- Can view all performance metrics

### 3. **MANAGER**
- Can invite Employees (not Managers)
- Can create and assign tasks
- Can view team performance metrics
- Can manage tasks assigned to their team

### 4. **EMPLOYEE**
- Can view assigned tasks
- Can update task status
- Can view own performance metrics
- Cannot invite users

## Invite System

### Creating Invites

**Who can invite:**
- **Admins/Owners**: Can invite both Managers and Employees
- **Managers**: Can only invite Employees

**How it works:**
1. Admin/Manager clicks "Invite Member" button
2. Enters email and selects role (Manager or Employee)
3. System generates unique invite token
4. Invite link is sent via email
5. Invite expires after 7 days

**Invite Link Format:**
```
https://yourapp.com/invite/{token}
```

### Accepting Invites

1. User clicks invite link
2. If not signed in, redirected to sign-in page
3. After sign-in, user sees invite details
4. User clicks "Accept Invitation"
5. User is added to organization with specified role
6. Welcome email is sent

### Invite Management

- View all pending invites on Members page
- See invite status (pending, used, expired)
- Track who invited whom
- Automatic expiration after 7 days

## Email Notifications

### 1. Task Assignment Email
**Sent to:** Employee when task is assigned

**Includes:**
- Task title and description
- Due date
- Priority level
- Who assigned the task (Manager/Admin name and email)
- Direct link to view task

**Triggered when:**
- New task is created and assigned
- Task assignee is changed

### 2. Task Progress Email
**Sent to:** Manager/Admin who assigned the task

**Includes:**
- Task title and description
- Employee name who updated the task
- Old status → New status
- Progress update message
- Direct link to view task

**Triggered when:**
- Employee updates task status
- Status changes (e.g., TO_DO → IN_PROGRESS → DONE)

### 3. Invite Email
**Sent to:** Invited user

**Includes:**
- Inviter's name
- Organization name
- Role being invited for
- Invite link (expires in 7 days)
- Instructions to accept

### 4. Welcome Email
**Sent to:** New user after accepting invite

**Includes:**
- Welcome message
- Organization name
- Link to dashboard
- Getting started information

## Task Details Display

### Task Information Shown

1. **Task Title & Description**
   - Full task details
   - Editable by task creator or assignee

2. **Status**
   - TO_DO, IN_PROGRESS, DONE, BLOCKED
   - Color-coded indicators

3. **Priority**
   - LOW, MEDIUM, HIGH, URGENT
   - Visual priority badges

4. **Due Date**
   - Flexible format (dates, events, seasons)
   - Examples: "2025-02-15", "by end of Q4", "next Monday"

5. **Assignee**
   - Employee name who is assigned
   - Shows "@username" on task cards

6. **Created By**
   - Manager/Admin name who created/assigned the task
   - Full details in task detail modal

### Task Detail Modal

- Click any task card to view full details
- Shows:
  - Assignee name and email
  - Creator/Assigner name
  - All task metadata
  - Edit/Delete options (based on permissions)

## AI Assistant Access

The AI assistant (Aura) has **full access to all database data**:

### Data Available to AI:
1. **All Tasks**
   - Complete task list
   - Task status, priority, assignee
   - Task history and updates

2. **All Members**
   - User names and IDs
   - Current workload (tasksCount)
   - Performance metrics

3. **Workload Balancing**
   - AI can see who has the least tasks
   - Automatically suggests best assignee
   - Considers task complexity

4. **Context Awareness**
   - AI knows all existing tasks
   - Can reference previous conversations
   - Understands team structure

### AI Capabilities:
- **Smart Assignment**: Suggests least busy employee
- **Workload Awareness**: Considers current task counts
- **Context Understanding**: References existing tasks
- **Intelligent Recommendations**: Based on team data

## Permission Matrix

| Action | OWNER | ADMIN | MANAGER | EMPLOYEE |
|--------|-------|-------|---------|----------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create Tasks | ✅ | ✅ | ✅ | ❌ |
| Assign Tasks | ✅ | ✅ | ✅ | ❌ |
| Edit All Tasks | ✅ | ✅ | ✅ | ❌ |
| Edit Own Tasks | ✅ | ✅ | ✅ | ✅ |
| Delete Tasks | ✅ | ✅ | ✅ | ❌ |
| View Members | ✅ | ✅ | ✅ | ✅ |
| View Metrics | ✅ | ✅ | ✅ | Own only |
| Invite Managers | ✅ | ✅ | ❌ | ❌ |
| Invite Employees | ✅ | ✅ | ✅ | ❌ |
| Manage Organization | ✅ | ❌ | ❌ | ❌ |

## Implementation Details

### Database Schema

**Users Table:**
- `role`: OWNER | ADMIN | MANAGER | EMPLOYEE
- `tasksCount`: Active task count (auto-calculated)
- `organizationId`: Links user to organization

**Invites Table:**
- `email`: Invited email address
- `role`: MANAGER | EMPLOYEE
- `token`: Unique invite token
- `used`: Boolean (tracks if accepted)
- `expiresAt`: 7 days from creation
- `invitedById`: Who created the invite

**Tasks Table:**
- `assigneeId`: Employee assigned to task
- `createdById`: Manager/Admin who created task
- `status`: Current task status
- `priority`: Task priority level

### Server Actions

**Invite Management:**
- `createInvite(email, role)`: Create new invite
- `getInvites()`: Get all invites for organization
- `addMemberViaInvite(token, clerkUserId, name)`: Accept invite

**Task Management:**
- `createTask()`: Creates task and sends assignment email
- `updateTaskAction()`: Updates task and sends progress email if status changed
- `fetchTasks()`: Gets all tasks with assignee and creator info

**Email Functions:**
- `sendTaskAssignmentEmail()`: Notify employee of new task
- `sendTaskProgressEmail()`: Notify manager of status update
- `sendInviteEmail()`: Send invite link
- `sendWelcomeEmail()`: Welcome new member

## Usage Examples

### Inviting a Manager (Admin Only)

```typescript
const { inviteLink } = await createInvite(
  "manager@company.com",
  "MANAGER"
);
// Email sent with invite link
```

### Inviting an Employee (Manager or Admin)

```typescript
const { inviteLink } = await createInvite(
  "employee@company.com",
  "EMPLOYEE"
);
// Email sent with invite link
```

### Task Assignment Flow

1. Manager creates task via AI or UI
2. Task assigned to employee
3. Employee receives email notification
4. Employee updates task status
5. Manager receives progress email

### Progress Notification Flow

1. Employee changes task status (e.g., TO_DO → IN_PROGRESS)
2. System detects status change
3. Finds task creator (Manager/Admin)
4. Sends progress email to creator
5. Email includes old status, new status, and employee name

## Security Considerations

1. **Invite Tokens**: Unique, non-guessable tokens
2. **Expiration**: Invites expire after 7 days
3. **One-time Use**: Invites marked as used after acceptance
4. **Role Validation**: Server-side permission checks
5. **Email Verification**: Invites tied to specific email addresses

## Future Enhancements

1. **Bulk Invites**: Invite multiple users at once
2. **Invite Resend**: Resend expired invites
3. **Role Changes**: Promote/demote users
4. **Custom Permissions**: Granular permission system
5. **Activity Log**: Track all invite and role changes
6. **Email Templates**: Customizable email templates
7. **Notification Preferences**: User-controlled email settings

