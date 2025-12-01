"use server";

import { cache } from 'react';
import { db } from './index';
import { tasks, users, performanceMetrics, organizations, invites, taskComments } from './schema';
import { eq, and, sql, count, inArray, or, isNull } from 'drizzle-orm';
import type { TaskComment } from './schema';
import { requireAuth, getCurrentUser, requireOrganization } from '@/lib/auth/clerk';
import { sendTaskAssignmentEmail, sendWelcomeEmail, sendInviteEmail, sendTaskProgressEmail } from '@/lib/email/brevo';
import { createInviteRecord, getInviteByToken, markInviteAsUsed, getInvitesForOrganization, generateInviteToken } from './invites';
import { canCreateTasks, canEditTask, canDeleteTask, canReassignTasks, canChangeTaskStatus, canCommentOnTask } from '@/lib/auth/permissions';
import type { Task, User, PerformanceMetric } from './schema';

// Cache auth context to avoid redundant calls
const getCachedAuthContext = cache(async () => {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  return { org, currentUser };
});

// Helper to recalculate tasksCount for a user
async function recalculateTasksCount(userId: string, organizationId: string): Promise<void> {
  const activeTasksCount = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.assigneeId, userId),
        eq(tasks.organizationId, organizationId),
        sql`${tasks.status} IN ('TO_DO', 'IN_PROGRESS', 'BLOCKED')`
      )
    );

  await db
    .update(users)
    .set({ 
      tasksCount: activeTasksCount[0]?.count || 0,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// Fetch all tasks for current organization (with role-based filtering)
export const fetchTasks = cache(async (): Promise<Task[]> => {
  const { org, currentUser } = await getCachedAuthContext();
  
  if (!currentUser) {
    throw new Error('User not found');
  }

  // Admin/Owner can see all tasks
  if (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') {
    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.organizationId, org.id),
      with: {
        assignee: true,
        createdBy: true,
        comments: {
          with: {
            user: true,
          },
          orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        },
      },
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });
    return allTasks;
  }
  
  // Manager can see all tasks assigned to members (EMPLOYEE role) and their own tasks
  if (currentUser.role === 'MANAGER') {
    // Get all employees in the organization
    const employees = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.organizationId, org.id),
          eq(users.role, 'EMPLOYEE')
        )
      );
    
    const employeeIds = employees.map(e => e.id);
    employeeIds.push(currentUser.id); // Include manager's own tasks
    
    // Manager can see: tasks assigned to employees, their own tasks, and tasks they created
    const managerTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.organizationId, org.id),
        or(
          isNull(tasks.assigneeId),
          inArray(tasks.assigneeId, employeeIds),
          eq(tasks.createdById, currentUser.id)
        )
      ),
      with: {
        assignee: true,
        createdBy: true,
        comments: {
          with: {
            user: true,
          },
          orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        },
      },
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });
    return managerTasks;
  }
  
  // Members can only see their own tasks
  if (currentUser.role === 'EMPLOYEE') {
    const userTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.organizationId, org.id),
        eq(tasks.assigneeId, currentUser.id)
      ),
      with: {
        assignee: true,
        createdBy: true,
        comments: {
          with: {
            user: true,
          },
          orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        },
      },
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });
    return userTasks;
  }

  return [];
});

// Fetch all members for current organization (with role-based filtering)
export const fetchMembers = cache(async (): Promise<User[]> => {
  const { org, currentUser } = await getCachedAuthContext();
  
  if (!currentUser) {
    throw new Error('User not found');
  }

  // Admin/Owner can see all members (including managers)
  if (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') {
    const allUsers = await db.query.users.findMany({
      where: eq(users.organizationId, org.id),
      orderBy: (users, { asc }) => [asc(users.name)],
    });
    return allUsers;
  }
  
  // Manager can see all members (employees) AND themselves for task assignment
  if (currentUser.role === 'MANAGER') {
    const membersOnly = await db.query.users.findMany({
      where: and(
        eq(users.organizationId, org.id),
        eq(users.role, 'EMPLOYEE')
      ),
      orderBy: (users, { asc }) => [asc(users.name)],
    });
    // Add the manager themselves to the list so they can assign tasks to themselves
    return [...membersOnly, currentUser];
  }
  
  // Members can only see themselves (for profile)
  if (currentUser.role === 'EMPLOYEE') {
    return [currentUser];
  }

  return [];
});

// Calculate and create/update performance metrics for a user
async function calculatePerformanceMetrics(userId: string, organizationId: string, useAI: boolean = true): Promise<PerformanceMetric> {
  // Get all tasks for this user
  const userTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.assigneeId, userId),
        eq(tasks.organizationId, organizationId)
      )
    );

  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = userTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const blockedTasks = userTasks.filter(t => t.status === 'BLOCKED').length;
  
  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate average completion time (in days)
  const completedTasksWithDates = userTasks.filter(t => 
    t.status === 'DONE' && t.createdAt && t.updatedAt
  );
  
  let averageTimeDays = 0;
  if (completedTasksWithDates.length > 0) {
    const totalDays = completedTasksWithDates.reduce((sum, task) => {
      const created = new Date(task.createdAt!);
      const updated = new Date(task.updatedAt!);
      const days = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + (days > 0 ? days : 1); // Minimum 1 day
    }, 0);
    averageTimeDays = Math.round(totalDays / completedTasksWithDates.length);
  }
  
  // Count overdue tasks (check due dates)
  const now = new Date();
  let tasksOverdue = 0;
  userTasks.forEach(task => {
    if (task.status !== 'DONE' && task.dueDate) {
      // Try to parse due date (could be date string or text like "end of Q4")
      const dueDateStr = task.dueDate.toLowerCase();
      // Simple check for date patterns
      if (dueDateStr.match(/\d{4}-\d{2}-\d{2}/)) {
        const dueDate = new Date(task.dueDate);
        if (dueDate < now) {
          tasksOverdue++;
        }
      }
    }
  });
  
  // Get user info for AI evaluation
  const userInfo = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const userName = userInfo[0]?.name || 'User';
  
  // Generate AI evaluation using Gemini if enabled
  let aiEvaluation = '';
  if (useAI && process.env.GEMINI_API_KEY) {
    try {
      aiEvaluation = await generateAIPerformanceEvaluation({
        userName,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        completionRate,
        averageTimeDays,
        tasksOverdue,
        tasks: userTasks.map(t => ({
          title: t.title,
          status: t.status,
          priority: t.priority || 'MEDIUM',
          dueDate: t.dueDate,
          createdAt: t.createdAt?.toISOString(),
          updatedAt: t.updatedAt?.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error generating AI evaluation:', error);
      // Fallback to basic evaluation
      aiEvaluation = generateBasicEvaluation(completionRate, averageTimeDays, completedTasks, tasksOverdue);
    }
  } else {
    // Use basic evaluation if AI is disabled or not configured
    aiEvaluation = generateBasicEvaluation(completionRate, averageTimeDays, completedTasks, tasksOverdue);
  }
  
  // Check if metric exists
  const existingMetric = await db
    .select()
    .from(performanceMetrics)
    .where(
      and(
        eq(performanceMetrics.userId, userId),
        eq(performanceMetrics.organizationId, organizationId)
      )
    )
    .limit(1);

  const metricData = {
    userId,
    organizationId,
    completionRate,
    averageTimeDays,
    tasksCompleted: completedTasks,
    tasksInProgress: inProgressTasks,
    tasksOverdue,
    lastAIEvaluation: aiEvaluation,
    evaluationDate: new Date(),
  };

  if (existingMetric[0]) {
    // Update existing metric
    const [updated] = await db
      .update(performanceMetrics)
      .set({
        ...metricData,
        updatedAt: new Date(),
      })
      .where(eq(performanceMetrics.id, existingMetric[0].id))
      .returning();
    return updated;
  } else {
    // Create new metric
    const [created] = await db
      .insert(performanceMetrics)
      .values(metricData)
      .returning();
    return created;
  }
}

// Generate AI-powered performance evaluation using Gemini
async function generateAIPerformanceEvaluation(data: {
  userName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionRate: number;
  averageTimeDays: number;
  tasksOverdue: number;
  tasks: Array<{
    title: string;
    status: string;
    priority: string;
    dueDate: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
}): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are Aura, an intelligent Performance Analyst for a task management system. Analyze the following performance data for ${data.userName} and provide a comprehensive, professional evaluation.

Performance Metrics:
- Total Tasks Assigned: ${data.totalTasks}
- Tasks Completed: ${data.completedTasks}
- Tasks In Progress: ${data.inProgressTasks}
- Tasks Blocked: ${data.blockedTasks}
- Completion Rate: ${data.completionRate}%
- Average Completion Time: ${data.averageTimeDays} days
- Overdue Tasks: ${data.tasksOverdue}

Recent Task Activity:
${data.tasks.slice(0, 10).map((t, i) => `${i + 1}. "${t.title}" - Status: ${t.status}, Priority: ${t.priority}, Due: ${t.dueDate}`).join('\n')}

Provide a detailed performance evaluation (2-3 paragraphs) that includes:
1. Overall performance assessment
2. Strengths and areas of excellence
3. Areas for improvement and specific recommendations
4. Workload analysis and capacity assessment
5. Suggestions for task assignment optimization

Be professional, constructive, and data-driven. Focus on actionable insights.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Fallback basic evaluation function
function generateBasicEvaluation(completionRate: number, avgTime: number, tasksCompleted: number, tasksOverdue: number): string {
  let evaluation = '';
  
  if (completionRate >= 90) {
    evaluation = `Excellent performance! ${completionRate}% completion rate demonstrates strong reliability and commitment. `;
  } else if (completionRate >= 75) {
    evaluation = `Strong performance with a ${completionRate}% completion rate. `;
  } else if (completionRate >= 60) {
    evaluation = `Good performance with room for improvement. Current completion rate is ${completionRate}%. `;
  } else {
    evaluation = `Performance needs attention. Completion rate of ${completionRate}% indicates challenges that should be addressed. `;
  }
  
  if (avgTime <= 5) {
    evaluation += `Tasks are completed efficiently with an average time of ${avgTime} days. `;
  } else if (avgTime <= 10) {
    evaluation += `Task completion time is reasonable at ${avgTime} days on average. `;
  } else {
    evaluation += `Task completion time could be improved (currently ${avgTime} days average). `;
  }
  
  if (tasksOverdue > 0) {
    evaluation += `⚠️ Attention needed: ${tasksOverdue} task(s) are currently overdue. `;
  }
  
  evaluation += `Has successfully completed ${tasksCompleted} tasks. `;
  
  if (completionRate >= 85 && avgTime <= 7 && tasksOverdue === 0) {
    evaluation += 'Recommended for high-priority and complex assignments.';
  } else if (completionRate >= 70) {
    evaluation += 'Suitable for standard task assignments.';
  } else {
    evaluation += 'Consider providing additional support and resources.';
  }
  
  return evaluation;
}

// Fetch performance metrics for current organization
export async function fetchPerformanceMetrics(forceRecalculate: boolean = false): Promise<PerformanceMetric[]> {
  const { org } = await getCachedAuthContext();
  
  // Get all users in organization (single query)
  const orgUsers = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, org.id));

  // Batch fetch existing metrics for all users (single query instead of N queries)
  const userIds = orgUsers.map(u => u.id);
  const existingMetrics = userIds.length > 0 ? await db
    .select()
    .from(performanceMetrics)
    .where(
      and(
        eq(performanceMetrics.organizationId, org.id),
        inArray(performanceMetrics.userId, userIds)
      )
    ) : [];

  const metricsMap = new Map(existingMetrics.map(m => [m.userId, m]));

  // Batch calculate metrics (parallel processing)
  const metricsPromises = orgUsers.map(async (user) => {
    const existingMetric = metricsMap.get(user.id);
    
    // Use AI evaluation if:
    // 1. Force recalculate is requested
    // 2. No metric exists
    // 3. Metric is older than 24 hours
    const shouldUseAI = forceRecalculate || 
      !existingMetric || 
      !existingMetric.evaluationDate ||
      (new Date().getTime() - new Date(existingMetric.evaluationDate).getTime()) > 24 * 60 * 60 * 1000;

    // Always recalculate metrics (with or without AI) to keep them current
    return calculatePerformanceMetrics(user.id, org.id, shouldUseAI);
  });
  
  await Promise.all(metricsPromises);

  // Fetch all metrics (single query)
  const metrics = await db
    .select()
    .from(performanceMetrics)
    .where(eq(performanceMetrics.organizationId, org.id));

  return metrics;
}

// Monitor all members' performance (triggers AI evaluation for all)
export async function monitorAllMembersPerformance(): Promise<{ success: boolean; evaluated: number; errors: string[] }> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  
  // Only Admin/Owner/Manager can trigger monitoring
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'OWNER' && currentUser.role !== 'MANAGER')) {
    throw new Error('You do not have permission to monitor performance');
  }
  
  // Get all users in organization
  const orgUsers = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, org.id));

  const errors: string[] = [];
  let evaluated = 0;

  // Evaluate each member with AI
  for (const user of orgUsers) {
    try {
      await calculatePerformanceMetrics(user.id, org.id, true);
      evaluated++;
    } catch (error) {
      const errorMsg = `Failed to evaluate ${user.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }
  }

  return {
    success: errors.length === 0,
    evaluated,
    errors,
  };
}

// Create a new task
export async function createTask(taskData: {
  title: string;
  description: string;
  assigneeId: string | null;
  dueDate: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}): Promise<Task> {
  const userId = await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }

  // Check permission: Only Admin/Owner/Manager can create tasks
  if (!(await canCreateTasks())) {
    throw new Error('You do not have permission to create tasks');
  }

  // If Manager, verify assignee is a member (employee) or themselves
  if (currentUser.role === 'MANAGER' && taskData.assigneeId) {
    const assignee = await db
      .select()
      .from(users)
      .where(eq(users.id, taskData.assigneeId))
      .limit(1);
    
    // Manager can assign to employees or themselves, but not to other managers/admins
    if (assignee[0] && assignee[0].role !== 'EMPLOYEE' && taskData.assigneeId !== currentUser.id) {
      throw new Error('Managers can only assign tasks to members (employees) or themselves');
    }
  }
  
  // Admin/Owner can assign to anyone (including themselves and managers)

  const [newTask] = await db
    .insert(tasks)
    .values({
      title: taskData.title,
      description: taskData.description,
      assigneeId: taskData.assigneeId || null,
      dueDate: taskData.dueDate,
      priority: taskData.priority || 'MEDIUM',
      status: 'TO_DO',
      organizationId: org.id,
      createdById: currentUser.id,
    })
    .returning();

  // Recalculate tasksCount for assignee if assigned
  if (taskData.assigneeId) {
    await recalculateTasksCount(taskData.assigneeId, org.id);
  }

  // Get assignee and send email (if assigned)
  if (taskData.assigneeId) {
    const assignee = await db.query.users.findFirst({
      where: eq(users.id, taskData.assigneeId),
    });

    if (assignee) {
      try {
        await sendTaskAssignmentEmail({
          to: assignee.email,
          toName: assignee.name,
          taskTitle: taskData.title,
          taskDescription: taskData.description || '',
          dueDate: taskData.dueDate,
          assignerName: currentUser.name,
          assignerEmail: currentUser.email,
          priority: taskData.priority || 'MEDIUM',
          status: 'TO_DO',
        });
      } catch (error) {
        console.error('Error sending assignment email:', error);
        // Don't throw - email failure shouldn't break task creation
      }
    }
  }

  return newTask;
}

// Update an existing task
export async function updateTaskAction(
  taskId: string,
  changes: Partial<Pick<Task, 'title' | 'description' | 'assigneeId' | 'status' | 'dueDate' | 'priority'>>
): Promise<Task> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }
  
  // Get current task to check for status/assignee changes
  const currentTask = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.organizationId, org.id)),
  });

  if (!currentTask) {
    throw new Error(`Task with id ${taskId} not found`);
  }

  // Check permissions based on what's being changed
  if (changes.status) {
    // Check if user can change status
    if (!(await canChangeTaskStatus(currentTask.assigneeId || null))) {
      throw new Error('You do not have permission to change task status');
    }
  }

  if (changes.assigneeId) {
    // Check if user can reassign
    if (!(await canReassignTasks())) {
      throw new Error('You do not have permission to reassign tasks');
    }
    
    // If Manager, verify new assignee is a member (employee) or themselves
    if (currentUser.role === 'MANAGER') {
      const newAssignee = await db
        .select()
        .from(users)
        .where(eq(users.id, changes.assigneeId))
        .limit(1);
      
      // Manager can reassign to employees or themselves, but not to other managers/admins
      if (newAssignee[0] && newAssignee[0].role !== 'EMPLOYEE' && changes.assigneeId !== currentUser.id) {
        throw new Error('Managers can only reassign tasks to members (employees) or themselves');
      }
    }
    
    // Admin/Owner can reassign to anyone (including themselves and managers)
  }

  // Check if user can edit task (for title, description, priority, dueDate)
  if (changes.title || changes.description || changes.priority || changes.dueDate) {
    // Members can only change status, not other fields
    if (currentUser.role === 'EMPLOYEE') {
      throw new Error('You can only update the status of your tasks');
    }
    
    // Check edit permission
    if (!(await canEditTask(currentTask.assigneeId || null, currentTask.createdById))) {
      throw new Error('You do not have permission to edit this task');
    }
    
    // If Manager, verify they can edit this task (must be assigned to a member, not another manager, or created by them)
    if (currentUser.role === 'MANAGER') {
      if (currentTask.assigneeId) {
        const assignee = await db
          .select()
          .from(users)
          .where(eq(users.id, currentTask.assigneeId))
          .limit(1);
        
        // Manager can edit if: created by them, OR assigned to a member (EMPLOYEE), but NOT if assigned to another manager/admin
        if (assignee[0] && assignee[0].role !== 'EMPLOYEE' && currentTask.createdById !== currentUser.id) {
          throw new Error('Managers can only edit tasks assigned to members or tasks they created');
        }
      }
    }
  }

  const [updatedTask] = await db
    .update(tasks)
    .set({
      ...changes,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  // If status changed from active to complete, or vice versa, update tasksCount
  const activeStatuses = ['TO_DO', 'IN_PROGRESS', 'BLOCKED'] as const;
  const wasActive = activeStatuses.includes(currentTask.status as any);
  const isActive = changes.status ? activeStatuses.includes(changes.status as any) : wasActive;

  // Update tasksCount if status changed
  if (wasActive !== isActive && currentTask.assigneeId) {
    await recalculateTasksCount(currentTask.assigneeId, org.id);
  }

  // If assignee changed, update tasksCount for both old and new assignees
  if (changes.assigneeId && changes.assigneeId !== currentTask.assigneeId) {
    if (currentTask.assigneeId) {
      await recalculateTasksCount(currentTask.assigneeId, org.id);
    }
    if (changes.assigneeId) {
      await recalculateTasksCount(changes.assigneeId, org.id);
    }
  }

  // Recalculate performance metrics for assignee if task status or assignee changed
  // (This ensures metrics stay current, but doesn't trigger expensive AI evaluation)
  const assigneeIdToUpdate = changes.assigneeId || currentTask.assigneeId;
  if (assigneeIdToUpdate && (changes.status || changes.assigneeId)) {
    // Recalculate without AI (faster, just update numbers)
    // AI evaluation will happen automatically when metrics are older than 24 hours
    try {
      await calculatePerformanceMetrics(assigneeIdToUpdate, org.id, false);
    } catch (error) {
      // Don't fail the task update if metrics calculation fails
      console.error('Error updating performance metrics:', error);
    }
  }

  // Send progress notification if status changed
  if (changes.status && changes.status !== currentTask.status && currentTask.assigneeId) {
    const assignee = await db
      .select()
      .from(users)
      .where(eq(users.id, currentTask.assigneeId))
      .limit(1);

    // Get the creator/assigner (who originally assigned the task)
    const creator = await db
      .select()
      .from(users)
      .where(eq(users.id, currentTask.createdById))
      .limit(1);

    if (assignee[0] && creator[0] && creator[0].id !== assignee[0].id) {
      try {
        await sendTaskProgressEmail({
          to: creator[0].email,
          toName: creator[0].name,
          taskTitle: updatedTask.title,
          taskDescription: updatedTask.description || '',
          assigneeName: assignee[0].name,
          status: changes.status,
          progressUpdate: `Task status changed from ${currentTask.status} to ${changes.status}`,
        });
      } catch (error) {
        console.error('Error sending progress email:', error);
      }
    }
  }

  // If assignee changed, update both old and new assignee's counts
  if (changes.assigneeId && changes.assigneeId !== currentTask.assigneeId) {
    if (currentTask.assigneeId) {
      await recalculateTasksCount(currentTask.assigneeId, org.id);
      // Update performance metrics for old assignee (without AI, just numbers)
      try {
        await calculatePerformanceMetrics(currentTask.assigneeId, org.id, false);
      } catch (error) {
        console.error('Error updating performance metrics for old assignee:', error);
      }
    }
    await recalculateTasksCount(changes.assigneeId, org.id);
    // Update performance metrics for new assignee (without AI, just numbers)
    try {
      await calculatePerformanceMetrics(changes.assigneeId, org.id, false);
    } catch (error) {
      console.error('Error updating performance metrics for new assignee:', error);
    }

    // Send email to new assignee
    const newAssignee = await db
      .select()
      .from(users)
      .where(eq(users.id, changes.assigneeId))
      .limit(1);

    const creator = await db
      .select()
      .from(users)
      .where(eq(users.id, currentTask.createdById))
      .limit(1);

    if (newAssignee[0] && creator[0]) {
      try {
        await sendTaskAssignmentEmail({
          to: newAssignee[0].email,
          toName: newAssignee[0].name,
          taskTitle: updatedTask.title,
          taskDescription: updatedTask.description || '',
          dueDate: updatedTask.dueDate,
          assignerName: creator[0].name,
          assignerEmail: creator[0].email,
          priority: updatedTask.priority || 'MEDIUM',
          status: updatedTask.status,
        });
      } catch (error) {
        console.error('Error sending assignment email:', error);
      }
    }
  }

  return updatedTask;
}

// Delete a task
export async function deleteTask(taskId: string): Promise<void> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }
  
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.organizationId, org.id)),
  });

  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }

  // Check delete permission
  if (!(await canDeleteTask(task.createdById))) {
    throw new Error('You do not have permission to delete this task');
  }

  await db.delete(tasks).where(eq(tasks.id, taskId));

  // Recalculate tasksCount if task was assigned
  if (task.assigneeId) {
    await recalculateTasksCount(task.assigneeId, org.id);
    // Update performance metrics
    try {
      await calculatePerformanceMetrics(task.assigneeId, org.id, false);
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }
}

// Check if user has permission to invite (Admin or Manager)
async function canInviteUsers(userRole: string): Promise<boolean> {
  return userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MANAGER';
}

// Create invite for manager or employee
export async function createInvite(
  email: string,
  role: 'MANAGER' | 'EMPLOYEE'
): Promise<{ invite: any; inviteLink: string }> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }

  // Check permissions
  if (!(await canInviteUsers(currentUser.role))) {
    throw new Error('You do not have permission to invite users');
  }

  // Only Admin/Owner can invite Managers
  if (role === 'MANAGER' && currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN') {
    throw new Error('Only Admins can invite Managers');
  }

  const invite = await createInviteRecord(
    org.id,
    email,
    role,
    currentUser.id
  );

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invite.token}`;

  // Send invite email
  try {
    await sendInviteEmail({
      to: email,
      role,
      inviteLink,
      organizationName: org.name,
      inviterName: currentUser.name,
    });
  } catch (error) {
    console.error('Error sending invite email:', error);
  }

  return { invite, inviteLink };
}

// Get all invites for current organization
export async function getInvites(): Promise<any[]> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }

  if (!(await canInviteUsers(currentUser.role))) {
    throw new Error('You do not have permission to view invites');
  }

  return await getInvitesForOrganization(org.id);
}

// Add a member to organization (via invite acceptance)
export async function addMemberViaInvite(
  inviteToken: string,
  clerkUserId: string,
  name: string
): Promise<User> {
  const invite = await getInviteByToken(inviteToken);
  
  if (!invite) {
    throw new Error('Invalid or expired invite');
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, invite.email),
        eq(users.organizationId, invite.organizationId)
      )
    )
    .limit(1);

  if (existingUser[0]) {
    throw new Error('User already exists in this organization');
  }

  // Create user with role from invite
  const dbRole = invite.role === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE';
  
  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: clerkUserId,
      name,
      email: invite.email,
      organizationId: invite.organizationId,
      role: dbRole,
      tasksCount: 0,
    })
    .returning();

  // Mark invite as used
  await markInviteAsUsed(inviteToken);

  // Send welcome email
  try {
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, invite.organizationId))
      .limit(1);
    
    if (org[0]) {
      await sendWelcomeEmail(invite.email, name, org[0].name);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }

  return newUser;
}

// Add a comment to a task
export async function addTaskComment(taskId: string, content: string): Promise<any> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }
  
  // Verify task exists and belongs to organization
  const task = await db.query.tasks.findFirst({
    where: and(
      eq(tasks.id, taskId),
      eq(tasks.organizationId, org.id)
    ),
  });
  
  if (!task) {
    throw new Error('Task not found');
  }
  
  // Check permission to comment
  const { canCommentOnTask } = await import('@/lib/auth/permissions');
  if (!(await canCommentOnTask(task.assigneeId || null))) {
    throw new Error('You do not have permission to comment on this task');
  }
  
  // Create comment
  const [newComment] = await db
    .insert(taskComments)
    .values({
      taskId,
      userId: currentUser.id,
      content: content.trim(),
    })
    .returning();
  
  // Fetch comment with user info
  const commentWithUser = await db.query.taskComments.findFirst({
    where: eq(taskComments.id, newComment.id),
    with: {
      user: true,
    },
  });
  
  return commentWithUser;
}

// Get comments for a task
export async function getTaskComments(taskId: string): Promise<any[]> {
  await requireAuth();
  const org = await requireOrganization();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }
  
  // Verify task exists and user has permission to view it
  const task = await db.query.tasks.findFirst({
    where: and(
      eq(tasks.id, taskId),
      eq(tasks.organizationId, org.id)
    ),
  });
  
  if (!task) {
    throw new Error('Task not found');
  }
  
  // Check if user can view this task
  if (currentUser.role === 'EMPLOYEE' && task.assigneeId !== currentUser.id) {
    throw new Error('You do not have permission to view this task');
  }
  
  // Get comments
  const comments = await db.query.taskComments.findMany({
    where: eq(taskComments.taskId, taskId),
    with: {
      user: true,
    },
    orderBy: (comments, { asc }) => [asc(comments.createdAt)],
  });
  
  return comments;
}

// Get organization trial status
export async function getTrialStatus() {
  await requireAuth();
  const org = await requireOrganization();
  
  const now = new Date();
  const trialEnd = new Date(org.trialEndDate);
  
  const isActive = now <= trialEnd;
  const daysRemaining = isActive 
    ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    isActive,
    daysRemaining,
    status: org.subscriptionStatus,
    trialEndDate: org.trialEndDate,
  };
}
