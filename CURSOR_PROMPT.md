# Cursor AI Prompt: AuraTask - Advanced AI-Powered Task Management System

## Project Overview

Build a complete, production-ready, full-stack Next.js 14 AI application called **AuraTask** - an advanced task management system with conversational AI capabilities. This is a multi-tenant SaaS application where organizations can subscribe and manage their tasks with AI assistance.

## Technology Stack (MANDATORY)

- **Framework**: Next.js 14+ (App Router ONLY - no Pages Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (latest version)
- **AI**: Google Gemini API (use `gemini-2.0-flash-exp` or latest available)
- **Authentication**: Clerk (for multi-tenant organization management)
- **Email Service**: Brevo (formerly Sendinblue) API
- **Voice**: Browser Speech Recognition API (WebKit) and Speech Synthesis API
- **Deployment Ready**: Vercel-optimized

## Core Application Features

### 1. Task Management System

**Task Model Requirements:**
- `id` (UUID, primary key)
- `title` (string, required)
- `description` (text, optional)
- `assigneeId` (foreign key to users, nullable initially)
- `status` (enum: `TO_DO`, `IN_PROGRESS`, `DONE`, `BLOCKED`)
- `dueDate` (string - flexible: accepts dates like "2025-02-15", events like "by end of Q4", or seasons like "Q1 2025")
- `organizationId` (foreign key - for multi-tenancy)
- `createdById` (foreign key to users)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `priority` (enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT` - optional enhancement)

**Task Views:**
- Kanban board with drag-and-drop (grouped by status)
- List view with filters (status, assignee, due date, priority)
- Calendar view (optional enhancement)
- Task detail modal/page with full information

### 2. AI Assistant (Aura) - Core Feature

**AI Capabilities:**
- **Conversational Interface**: Both text and voice interaction
- **Voice Features**: 
  - Speech-to-Text (STT) using browser WebKit Speech Recognition API
  - Text-to-Speech (TTS) using browser Speech Synthesis API
  - Visual indicators for listening/speaking states
- **Task Logging**: AI extracts task details from natural language
- **Interactive Task Creation**: AI asks follow-up questions:
  - "What is the task title?"
  - "Can you describe the requirements?"
  - "Who should this be assigned to? (I can suggest someone with lighter workload)"
  - "When is this due? (specific date, event, or season)"
  - "What priority level? (Low, Medium, High, Urgent)"
- **Task Management**: AI can:
  - Create tasks (`LOG_TASK` action)
  - Edit existing tasks (`EDIT_TASK` action)
  - Assign/reassign tasks
  - Update task status
  - Delete tasks (with confirmation)
  - Search and discuss specific tasks one-by-one
- **Workload Intelligence**: 
  - AI has access to all employees' current task counts
  - Suggests employees with lighter workloads when user doesn't specify assignee
  - Considers task complexity when suggesting assignments
- **Performance Evaluation**: 
  - AI evaluates each member's performance periodically
  - Stores evaluation in `performanceMetrics` table
  - Provides insights on completion rates, average time, strengths/weaknesses

**AI System Prompt Structure:**
```
You are Aura, an intelligent and diligent Project Manager Assistant for [Organization Name].

Your capabilities:
1. Extract task details from natural language conversations
2. Ask clarifying questions when information is incomplete
3. Suggest optimal task assignments based on workload data
4. Manage tasks: create, edit, assign, update status, delete
5. Discuss tasks individually with users
6. Evaluate team member performance

Current organization members and their workload:
[Member Name] (ID: [id]): [X] active tasks
[Member Name] (ID: [id]): [Y] active tasks
...

Workload Balancing Rule: When user doesn't specify an assignee, analyze task complexity and suggest the employee with the lowest workload who can handle it.

Always respond in a helpful, professional, and conversational tone. Use the structured JSON response format for task operations.
```

**AI Response Schema:**
```typescript
interface AIResponse {
  action: "LOG_TASK" | "CONVERSATION" | "EDIT_TASK" | "DELETE_TASK" | "ASSIGN_TASK";
  conversationReply: string; // Text to display and speak
  proposedTask?: {
    title: string;
    description: string;
    assigneeId?: string; // Optional - AI can suggest
    dueDate: string;
    status: "TO_DO";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  };
  taskId?: string; // For edit/delete/assign actions
  suggestedAssignee?: {
    userId: string;
    reason: string; // Why this person was suggested
  };
}
```

### 3. User & Organization Management

**User Model:**
- `id` (UUID, primary key)
- `clerkId` (string, unique - from Clerk authentication)
- `name` (string)
- `email` (string, unique)
- `organizationId` (foreign key)
- `role` (enum: `OWNER`, `ADMIN`, `MEMBER`)
- `tasksCount` (computed/updated field - active tasks only)
- `createdAt`, `updatedAt`

**Organization Model:**
- `id` (UUID, primary key)
- `name` (string)
- `clerkOrganizationId` (string, unique - from Clerk)
- `subscriptionStatus` (enum: `TRIAL`, `ACTIVE`, `CANCELLED`, `EXPIRED`)
- `trialStartDate` (timestamp)
- `trialEndDate` (timestamp)
- `subscriptionStartDate` (timestamp, nullable)
- `subscriptionEndDate` (timestamp, nullable)
- `plan` (enum: `FREE_TRIAL`, `BASIC`, `PRO`, `ENTERPRISE`)
- `createdAt`, `updatedAt`

**Member Management:**
- Add members to organization (via email invitation)
- View all members with their workload
- Remove members (with permission checks)
- Role-based access control

### 4. Performance Metrics & Analytics

**PerformanceMetrics Model:**
- `id` (UUID, primary key)
- `userId` (foreign key)
- `organizationId` (foreign key)
- `completionRate` (number, 0-100)
- `averageTimeDays` (number, decimal)
- `tasksCompleted` (number)
- `tasksInProgress` (number)
- `tasksOverdue` (number)
- `lastAIEvaluation` (text) - AI-generated performance summary
- `evaluationDate` (timestamp)
- `createdAt`, `updatedAt`

**Analytics Dashboard:**
- Individual member performance cards
- Team-wide statistics
- Task completion trends
- Workload distribution charts
- AI-generated insights and recommendations

### 5. Email Notifications (Brevo Integration)

**Email Triggers:**
- Task assigned to member → Send email with task details
- Task status updated → Notify relevant parties
- Task due date approaching → Reminder emails
- Member added to organization → Welcome email
- Trial period ending → Subscription reminder

**Brevo Integration:**
- Use Brevo Transactional API
- Create email templates in Brevo dashboard
- Send emails via Server Actions
- Track email delivery status
- Handle bounces and failures gracefully

### 6. Subscription & Trial Management

**Trial System:**
- 20-day free trial for new organizations
- Prominent trial banner on dashboard (non-dismissible)
- Trial countdown timer
- Automatic trial expiration handling
- Upgrade prompts before trial ends

**Subscription Features:**
- Stripe integration for payments (optional enhancement)
- Subscription status checks on protected routes
- Organization-level feature gating
- Usage limits based on plan tier

## Database Schema (Drizzle ORM)

Create comprehensive Drizzle schema files:

```typescript
// lib/db/schema.ts
import { pgTable, uuid, varchar, text, timestamp, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const taskStatusEnum = pgEnum('task_status', ['TO_DO', 'IN_PROGRESS', 'DONE', 'BLOCKED']);
export const taskPriorityEnum = pgEnum('task_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const userRoleEnum = pgEnum('user_role', ['OWNER', 'ADMIN', 'MEMBER']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']);
export const planEnum = pgEnum('plan', ['FREE_TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']);

// Tables with proper relations
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  clerkOrganizationId: varchar('clerk_organization_id', { length: 255 }).notNull().unique(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('TRIAL').notNull(),
  trialStartDate: timestamp('trial_start_date').notNull(),
  trialEndDate: timestamp('trial_end_date').notNull(),
  subscriptionStartDate: timestamp('subscription_start_date'),
  subscriptionEndDate: timestamp('subscription_end_date'),
  plan: planEnum('plan').default('FREE_TRIAL').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  role: userRoleEnum('role').default('MEMBER').notNull(),
  tasksCount: integer('tasks_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  status: taskStatusEnum('status').default('TO_DO').notNull(),
  dueDate: varchar('due_date', { length: 255 }).notNull(),
  priority: taskPriorityEnum('priority').default('MEDIUM'),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const performanceMetrics = pgTable('performance_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  completionRate: integer('completion_rate').default(0).notNull(),
  averageTimeDays: integer('average_time_days').default(0).notNull(),
  tasksCompleted: integer('tasks_completed').default(0).notNull(),
  tasksInProgress: integer('tasks_in_progress').default(0).notNull(),
  tasksOverdue: integer('tasks_overdue').default(0).notNull(),
  lastAIEvaluation: text('last_ai_evaluation'),
  evaluationDate: timestamp('evaluation_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  tasks: many(tasks),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  assignedTasks: many(tasks),
  createdTasks: many(tasks, {
    relationName: 'createdBy',
  }),
  performanceMetrics: many(performanceMetrics),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: 'createdBy',
  }),
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
}));
```

## File Structure

```
aura-task/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard with Kanban
│   │   ├── members/
│   │   │   └── page.tsx           # Members & performance
│   │   ├── analytics/
│   │   │   └── page.tsx           # Analytics dashboard
│   │   └── settings/
│   │       └── page.tsx           # Organization settings
│   ├── api/
│   │   ├── ai/
│   │   │   └── task-assistant/
│   │   │       └── route.ts      # AI Assistant API
│   │   ├── webhooks/
│   │   │   ├── clerk/
│   │   │   │   └── route.ts      # Clerk webhooks
│   │   │   └── stripe/
│   │   │       └── route.ts      # Stripe webhooks (optional)
│   │   └── brevo/
│   │       └── route.ts          # Brevo email sending
│   ├── layout.tsx                 # Root layout with ClerkProvider
│   ├── page.tsx                   # Landing/redirect page
│   └── globals.css                # Global styles
├── components/
│   ├── ai/
│   │   ├── AIChatBox.tsx          # Main AI chat interface
│   │   ├── TaskConfirmation.tsx   # Task confirmation modal
│   │   └── VoiceControls.tsx      # Voice input/output controls
│   ├── tasks/
│   │   ├── KanbanBoard.tsx        # Drag-and-drop Kanban
│   │   ├── TaskCard.tsx           # Individual task card
│   │   ├── TaskModal.tsx          # Task detail modal
│   │   └── TaskFilters.tsx        # Filter controls
│   ├── members/
│   │   ├── MemberCard.tsx         # Member performance card
│   │   ├── AddMemberModal.tsx     # Add member form
│   │   └── MemberList.tsx         # Members list view
│   ├── ui/
│   │   ├── ThemeToggle.tsx        # Dark/light mode
│   │   ├── TrialBanner.tsx        # Trial status banner
│   │   └── SubscriptionBadge.tsx  # Subscription status
│   └── layout/
│       ├── Header.tsx             # App header
│       └── Sidebar.tsx            # Navigation sidebar
├── lib/
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema
│   │   ├── index.ts               # DB connection
│   │   ├── actions.ts             # Server Actions (CRUD)
│   │   └── queries.ts             # Complex queries
│   ├── ai/
│   │   ├── gemini.ts              # Gemini client
│   │   └── prompts.ts             # AI prompt templates
│   ├── email/
│   │   ├── brevo.ts               # Brevo client
│   │   └── templates.ts           # Email templates
│   ├── auth/
│   │   └── clerk.ts               # Clerk utilities
│   └── utils/
│       ├── date.ts                # Date utilities
│       └── validation.ts          # Validation helpers
├── types/
│   ├── database.ts                # Database types
│   └── speech-recognition.d.ts    # Speech API types
├── .env.example                   # Environment variables template
└── README.md                      # Project documentation
```

## Design Requirements

### Color Palette (Dark Mode Default)

**Background:**
- Base: `#171725` (very dark)
- Surface: `#1a1a2e` (slightly lighter)
- Elevated: `#16213e` (cards, modals)

**Primary Accents:**
- Deep Royal Purple: `#8B5CF6` (primary actions, highlights)
- Cool Teal/Aqua: `#20B2AA` (secondary actions, success states)
- Muted Blue: `#4A90E2` (info, links)

**Text:**
- Primary: `#FFFFFF` / `#F5F5F5`
- Secondary: `#B0B0B0`
- Muted: `#6B6B6B`

**Borders & Dividers:**
- Subtle: `rgba(139, 92, 246, 0.2)` (purple with opacity)
- Accent: `rgba(32, 178, 170, 0.3)` (teal with opacity)

**Light Mode:**
- Background: `#F8F9FA`
- Surface: `#FFFFFF`
- Text: `#1a1a2e`
- Maintain same accent colors but adjust opacity/contrast

### Design Principles

1. **Futuristic but Professional**: 
   - Subtle glow effects (not harsh neon)
   - Smooth gradients
   - Glassmorphism for modals/cards
   - Soft shadows and borders

2. **User Experience**:
   - Smooth animations (200-300ms transitions)
   - Clear visual hierarchy
   - Accessible contrast ratios
   - Responsive design (mobile-first)

3. **Visual Elements**:
   - Rounded corners (8-12px)
   - Subtle inner shadows
   - Border highlights on hover
   - Loading states with skeleton screens
   - Empty states with helpful illustrations

## Implementation Requirements

### 1. Authentication Setup (Clerk)

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- Protect all dashboard routes with `auth()` from Clerk
- Get organization context from Clerk organization
- Sync Clerk users with database on first login
- Handle organization creation/joining

### 2. Database Setup (Drizzle + PostgreSQL)

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

- Use connection pooling
- Implement migrations with Drizzle Kit
- Add database indexes for performance
- Use transactions for complex operations

### 3. Server Actions (All Data Mutations)

**CRUD Operations:**
- `createTask()` - Create task, update assignee's tasksCount, send email
- `updateTask()` - Update task, handle status changes, recalculate counts
- `deleteTask()` - Delete task, update counts
- `assignTask()` - Assign/reassign task, send notification email
- `createMember()` - Add member to organization, send welcome email
- `updateMember()` - Update member details/role
- `removeMember()` - Remove member from organization
- `evaluatePerformance()` - AI-generated performance evaluation

**Important:** All Server Actions must:
- Validate input
- Check authentication and permissions
- Update related fields (tasksCount, etc.)
- Handle errors gracefully
- Return proper types

### 4. AI Integration (Gemini)

```typescript
// lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAIResponse(prompt: string, context: AIContext) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: buildSystemPrompt(context),
  });
  
  const result = await model.generateContent(prompt);
  return parseAIResponse(result.response.text());
}
```

- Implement structured output parsing
- Handle API errors and rate limits
- Cache frequently used responses
- Log AI interactions for debugging

### 5. Email Service (Brevo)

```typescript
// lib/email/brevo.ts
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.BREVO_API_KEY!);

export async function sendTaskAssignmentEmail(
  to: string,
  task: Task,
  assignee: User
) {
  const sendSmtpEmail: SendSmtpEmail = {
    to: [{ email: to }],
    templateId: 1, // Create template in Brevo dashboard
    params: {
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.dueDate,
      assigneeName: assignee.name,
    },
  };
  
  await apiInstance.sendTransacEmail(sendSmtpEmail);
}
```

- Create email templates in Brevo dashboard
- Handle email delivery failures
- Track email opens/clicks (optional)
- Implement retry logic for failed sends

### 6. Voice Features Implementation

```typescript
// components/ai/VoiceControls.tsx
'use client';

export function VoiceControls() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
      };
    }
  }, []);
  
  // Implementation...
}
```

- Handle browser compatibility
- Request microphone permissions
- Show visual feedback (listening indicator)
- Handle speech recognition errors
- Implement TTS for AI responses

### 7. Trial & Subscription Management

```typescript
// lib/utils/subscription.ts
export function checkTrialStatus(organization: Organization): {
  isActive: boolean;
  daysRemaining: number;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
} {
  const now = new Date();
  const trialEnd = new Date(organization.trialEndDate);
  
  if (now > trialEnd) {
    return { isActive: false, daysRemaining: 0, status: 'EXPIRED' };
  }
  
  const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { isActive: true, daysRemaining, status: 'TRIAL' };
}
```

- Check trial status on every page load
- Show trial banner with countdown
- Block access after trial expires (optional)
- Send reminder emails before expiration

## Cool Feature Suggestions

1. **AI Task Suggestions**: AI proactively suggests tasks based on patterns
2. **Smart Due Date Parsing**: AI understands "next Monday", "end of month", etc.
3. **Task Dependencies**: Link tasks that depend on each other
4. **Time Tracking**: Optional time logging for tasks
5. **File Attachments**: Attach files to tasks
6. **Task Comments**: Threaded comments on tasks
7. **Recurring Tasks**: Set up repeating tasks
8. **Task Templates**: Pre-defined task templates for common workflows
9. **Integration Hub**: Connect with Slack, Google Calendar, etc.
10. **Mobile App**: React Native companion app
11. **AI Insights Dashboard**: AI-generated insights about team productivity
12. **Custom Workflows**: Define custom task statuses and workflows
13. **Bulk Operations**: Select multiple tasks for batch actions
14. **Export/Import**: Export tasks to CSV, import from other tools
15. **Activity Feed**: Timeline of all task activities

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/auratask

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Brevo Email
BREVO_API_KEY=your_brevo_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Stripe (for subscriptions)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Testing Requirements

- Unit tests for Server Actions
- Integration tests for API routes
- E2E tests for critical user flows
- Test AI response parsing
- Test email sending
- Test authentication flows

## Performance Optimization

- Implement React Server Components where possible
- Use Next.js Image optimization
- Add loading states and skeletons
- Implement pagination for large lists
- Cache AI responses when appropriate
- Optimize database queries with proper indexes
- Use React.memo for expensive components

## Security Considerations

- Validate all user inputs
- Sanitize data before storing
- Implement rate limiting on API routes
- Use parameterized queries (Drizzle handles this)
- Check organization membership on all operations
- Implement CSRF protection
- Secure environment variables
- Use HTTPS in production

## Deployment Checklist

- [ ] Set up PostgreSQL database (Vercel Postgres, Supabase, or Railway)
- [ ] Configure Clerk production keys
- [ ] Set up Brevo account and templates
- [ ] Run database migrations
- [ ] Set all environment variables
- [ ] Test email delivery
- [ ] Test AI integration
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure custom domain
- [ ] Set up analytics (optional)

## Code Quality Standards

- Use TypeScript strict mode
- Follow Next.js 14 App Router best practices
- Implement proper error boundaries
- Add loading and error states
- Write self-documenting code
- Add JSDoc comments for complex functions
- Follow consistent naming conventions
- Use ESLint and Prettier
- Format code before committing

## Final Notes

- This is a production application - code quality matters
- Focus on user experience and performance
- Make it scalable for multiple organizations
- Ensure data isolation between organizations
- Implement proper error handling throughout
- Add comprehensive logging for debugging
- Make the UI intuitive and beautiful
- Test thoroughly before deployment

---

**Start building from a fresh Next.js 14 starter with TypeScript and Tailwind CSS. Implement features incrementally, test as you go, and ensure everything works together seamlessly.**

