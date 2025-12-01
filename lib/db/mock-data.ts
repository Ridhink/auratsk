// Mock data structure for initial development
import type { Task, User, PerformanceMetric } from "./types";

// Mock database storage (simulating in-memory database)
let tasks: Task[] = [
  {
    id: "1",
    title: "Design new landing page",
    description: "Create a modern, responsive landing page design",
    assigneeId: "user1",
    status: "IN_PROGRESS",
    dueDate: "by end of Q4",
  },
  {
    id: "2",
    title: "Implement authentication",
    description: "Set up user authentication system",
    assigneeId: "user2",
    status: "TO_DO",
    dueDate: "2025-02-15",
  },
  {
    id: "3",
    title: "Write API documentation",
    description: "Document all API endpoints",
    assigneeId: "user1",
    status: "DONE",
    dueDate: "2025-01-30",
  },
];

let users: User[] = [
  {
    id: "user1",
    name: "Alice Johnson",
    email: "alice@example.com",
    tasksCount: 1, // Only IN_PROGRESS tasks count
  },
  {
    id: "user2",
    name: "Bob Smith",
    email: "bob@example.com",
    tasksCount: 1,
  },
  {
    id: "user3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    tasksCount: 0,
  },
];

let performanceMetrics: PerformanceMetric[] = [
  {
    userId: "user1",
    completionRate: 85,
    averageTimeDays: 5.2,
    lastAIEvaluation: "Alice demonstrates strong performance with consistent task completion. Her average completion time of 5.2 days is excellent. Recommended for complex projects.",
  },
  {
    userId: "user2",
    completionRate: 72,
    averageTimeDays: 7.8,
    lastAIEvaluation: "Bob shows steady progress. While completion rate is good, there's room for improvement in time management. Consider providing additional support for time-sensitive tasks.",
  },
  {
    userId: "user3",
    completionRate: 90,
    averageTimeDays: 4.5,
    lastAIEvaluation: "Charlie excels in task completion with the highest completion rate and fastest average time. Ideal for high-priority assignments.",
  },
];

// Helper function to recalculate tasksCount for a user
export function recalculateTasksCount(userId: string): void {
  const activeStatuses: Task["status"][] = ["TO_DO", "IN_PROGRESS", "BLOCKED"];
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.tasksCount = tasks.filter(
      (t) => t.assigneeId === userId && activeStatuses.includes(t.status)
    ).length;
  }
}

// Export getters and setters
export function getTasks(): Task[] {
  return tasks;
}

export function getUsers(): User[] {
  return users;
}

export function getPerformanceMetrics(): PerformanceMetric[] {
  return performanceMetrics;
}

export function addTask(task: Task): void {
  tasks.push(task);
  recalculateTasksCount(task.assigneeId);
}

export function updateTask(taskId: string, changes: Partial<Task>): void {
  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex !== -1) {
    const oldTask = tasks[taskIndex];
    tasks[taskIndex] = { ...tasks[taskIndex], ...changes };
    
    // If status changed from active to complete, update tasksCount
    const activeStatuses: Task["status"][] = ["TO_DO", "IN_PROGRESS", "BLOCKED"];
    const wasActive = activeStatuses.includes(oldTask.status);
    const isActive = changes.status ? activeStatuses.includes(changes.status) : wasActive;
    
    if (wasActive && !isActive) {
      recalculateTasksCount(oldTask.assigneeId);
    } else if (!wasActive && isActive) {
      recalculateTasksCount(oldTask.assigneeId);
    }
    
    // If assignee changed, update both old and new assignee's counts
    if (changes.assigneeId && changes.assigneeId !== oldTask.assigneeId) {
      recalculateTasksCount(oldTask.assigneeId);
      recalculateTasksCount(changes.assigneeId);
    }
  }
}

export function getUserById(userId: string): User | undefined {
  return users.find((u) => u.id === userId);
}

export function getUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email === email);
}

