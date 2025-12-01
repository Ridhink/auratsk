import { pgTable, uuid, varchar, text, timestamp, integer, pgEnum, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const taskStatusEnum = pgEnum('task_status', ['TO_DO', 'IN_PROGRESS', 'DONE', 'BLOCKED']);
export const taskPriorityEnum = pgEnum('task_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const userRoleEnum = pgEnum('user_role', ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']);
export const planEnum = pgEnum('plan', ['FREE_TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']);

// Organizations Table
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

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  role: userRoleEnum('role').default('EMPLOYEE').notNull(),
  tasksCount: integer('tasks_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index('users_organization_id_idx').on(table.organizationId),
  clerkIdIdx: index('users_clerk_id_idx').on(table.clerkId),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Tasks Table
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
}, (table) => ({
  organizationIdIdx: index('tasks_organization_id_idx').on(table.organizationId),
  assigneeIdIdx: index('tasks_assignee_id_idx').on(table.assigneeId),
  statusIdx: index('tasks_status_idx').on(table.status),
  createdByIdIdx: index('tasks_created_by_id_idx').on(table.createdById),
  organizationStatusIdx: index('tasks_organization_status_idx').on(table.organizationId, table.status),
}));

// Performance Metrics Table
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
}, (table) => ({
  userIdIdx: index('performance_metrics_user_id_idx').on(table.userId),
  organizationIdIdx: index('performance_metrics_organization_id_idx').on(table.organizationId),
  userOrgIdx: index('performance_metrics_user_org_idx').on(table.userId, table.organizationId),
}));

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  tasks: many(tasks),
  performanceMetrics: many(performanceMetrics),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  assignedTasks: many(tasks, {
    relationName: 'assignee',
  }),
  createdTasks: many(tasks, {
    relationName: 'createdBy',
  }),
  performanceMetrics: many(performanceMetrics),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: 'assignee',
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
  comments: many(taskComments),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  user: one(users, {
    fields: [performanceMetrics.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [performanceMetrics.organizationId],
    references: [organizations.id],
  }),
}));

// Invites Table
export const invites = pgTable('invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  invitedById: uuid('invited_by_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  used: boolean('used').default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Task Comments Table
export const taskComments = pgTable('task_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index('task_comments_task_id_idx').on(table.taskId),
  userIdIdx: index('task_comments_user_id_idx').on(table.userId),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  organization: one(organizations, {
    fields: [invites.organizationId],
    references: [organizations.id],
  }),
  invitedBy: one(users, {
    fields: [invites.invitedById],
    references: [users.id],
  }),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;

// Type exports for use in application
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type NewPerformanceMetric = typeof performanceMetrics.$inferInsert;

