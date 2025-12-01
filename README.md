# AuraTask - AI-Powered Task Management System

AuraTask is an advanced, AI-driven task management system for organizations built with Next.js 14, TypeScript, and Tailwind CSS. The application features a conversational AI assistant (Aura) that handles task logging and automated workload balancing.

## Features

- 🤖 **AI Assistant (Aura)**: Conversational AI powered by Google Gemini that extracts task details and balances workloads
- 📋 **Kanban Board**: Drag-and-drop task management with status tracking
- 👥 **Member Management**: View team members with workload metrics and AI-generated performance evaluations
- 🎤 **Voice Support**: Speech-to-text and text-to-speech using browser APIs
- 🌓 **Dark/Light Mode**: Futuristic dark theme with toggle support
- ⚖️ **Workload Balancing**: Automatic assignment to least busy team members

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Database**: Simulated with mock data (ready for Drizzle ORM + PostgreSQL)
- **AI**: Google Gemini API (gemini-2.0-flash-exp)
- **Voice**: Browser Speech Recognition & Synthesis APIs

## Database Migrations

When you make changes to `lib/db/schema.ts`, you need to reflect them in your database:

**Quick (Development):**
```bash
npm run db:push
```

**Recommended (Production):**
```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations
```

See `SCHEMA_MIGRATION_GUIDE.md` for detailed instructions.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd aura-task
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will automatically redirect to `/dashboard`.

## Project Structure

```
aura-task/
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── task-assistant/    # AI Assistant API route
│   ├── dashboard/                 # Main dashboard with Kanban board
│   ├── members/                   # Team members & performance metrics
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home (redirects to dashboard)
├── components/
│   ├── ai/
│   │   ├── AIChatBox.tsx          # Main chat interface with voice
│   │   └── TaskConfirmation.tsx   # Task confirmation modal
│   └── ThemeToggle.tsx            # Dark/light mode toggle
├── lib/
│   └── db/
│       ├── actions.ts             # Server Actions (CRUD operations)
│       ├── mock-data.ts          # Simulated database
│       └── types.ts              # TypeScript interfaces
└── types/
    └── speech-recognition.d.ts    # Web Speech API types
```

## Usage

### Creating Tasks via AI

1. Navigate to the dashboard
2. Use the Aura Assistant chat box on the right
3. Type or use voice input to describe a task, for example:
   - "Create a task to design a new landing page, assign it to Alice, due by end of Q4"
   - "I need someone to review the API documentation by next Monday"
4. Aura will extract task details and suggest an assignee based on workload
5. Confirm the task creation in the modal

### Managing Tasks

- **Drag and Drop**: Drag tasks between columns to update their status
- **View Members**: Click "Members" in the header to see workload and performance metrics

### Voice Features

- **Microphone Button**: Click to start voice input (browser will ask for permission)
- **Speaker Button**: Click to have Aura read the last response aloud

## Data Model

### Tasks
- `id`: Unique identifier
- `title`: Task title
- `description`: Task description
- `assigneeId`: Assigned user ID
- `status`: TO_DO | IN_PROGRESS | DONE | BLOCKED
- `dueDate`: Flexible text field (dates, events, or seasons)

### Users
- `id`: Unique identifier
- `name`: User name
- `email`: User email
- `tasksCount`: Active task count (for workload balancing)

### Performance Metrics
- `userId`: User ID
- `completionRate`: Percentage (0-100)
- `averageTimeDays`: Average completion time
- `lastAIEvaluation`: AI-generated performance summary

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)

## Development Notes

- The application uses mock data stored in memory (see `lib/db/mock-data.ts`)
- To integrate with a real database, replace the mock data functions with Drizzle ORM queries
- Email notifications are simulated (see `sendAssignmentEmail` in `lib/db/actions.ts`)
- For production, integrate with Brevo or another email service

## Browser Compatibility

- **Voice Input**: Requires Chrome, Edge, or Safari (WebKit Speech Recognition)
- **Voice Output**: Supported in all modern browsers (Speech Synthesis API)

## License

This project is private and proprietary.
