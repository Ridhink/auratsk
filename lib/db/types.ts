// Data model types simulating Drizzle ORM schema

export type TaskStatus = "TO_DO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  dueDate: string; // Flexible text field for DATE, EVENT, or SEASON
}

export interface User {
  id: string;
  name: string;
  email: string;
  tasksCount: number; // Active task count for Workload Balancing
}

export interface PerformanceMetric {
  userId: string;
  completionRate: number;
  averageTimeDays: number;
  lastAIEvaluation: string; // AI-generated performance summary/score
}

