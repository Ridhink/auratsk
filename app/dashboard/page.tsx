"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchTasks, updateTaskAction, fetchMembers } from "@/lib/db/actions";
import type { Task } from "@/lib/db/schema";
import AIChatFAB from "@/components/ai/AIChatFAB";
import TaskFilters, { type FilterState } from "@/components/tasks/TaskFilters";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import QuickAddTask from "@/components/tasks/QuickAddTask";
import EmptyState from "@/components/ui/EmptyState";
import { KanbanColumnSkeleton, TaskCardSkeleton } from "@/components/ui/Skeleton";
import { useKeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";

type TaskStatus = "TO_DO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

const STATUSES: TaskStatus[] = ["TO_DO", "IN_PROGRESS", "DONE", "BLOCKED"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TO_DO: "border-gray-500 bg-gray-800/50",
  IN_PROGRESS: "border-purple-700/50 bg-purple-900/30",
  DONE: "border-teal-700/50 bg-teal-900/30",
  BLOCKED: "border-red-800/50 bg-red-900/30",
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "ALL",
    priority: "ALL",
    assignee: "ALL",
  });
  const { notification, showNotification, clearNotification } = useNotification();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onQuickAdd: () => {
      // Trigger quick add by clicking the FAB
      const fab = document.querySelector('button[aria-label="Add new task"]') as HTMLButtonElement;
      fab?.click();
    },
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement;
      searchInput?.focus();
    },
  });

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Parallel fetch for better performance
      const [fetchedTasks, fetchedMembers] = await Promise.all([
        fetchTasks(),
        fetchMembers(),
      ]);
      setTasks(fetchedTasks);
      
      // Ensure current user is included in members list for task assignment
      const membersList = fetchedMembers.map(m => ({ id: m.id, name: m.name }));
      if (currentUser && !membersList.find(m => m.id === currentUser.id)) {
        membersList.push({ id: currentUser.id, name: currentUser.name });
      }
      setMembers(membersList);
    } catch (error) {
      console.error("Error loading data:", error);
      setError(error instanceof Error ? error.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load data once on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser?.id, loadData]);

  // Refresh tasks when window gains focus or when a task is created
  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    const handleTaskCreated = () => {
      loadData();
    };
    
    window.addEventListener("focus", handleFocus);
    window.addEventListener("taskCreated", handleTaskCreated);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("taskCreated", handleTaskCreated);
    };
  }, []);

  // Memoized filter handler
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  // Optimized task filtering with memoization
  const filteredTasks = useMemo(() => {
    if (!filters.search && filters.status === "ALL" && filters.priority === "ALL" && filters.assignee === "ALL") {
      return tasks; // Return all tasks if no filters applied
    }

    const searchLower = filters.search?.toLowerCase() || "";
    return tasks.filter((task) => {
      // Search filter (only if search term exists)
      if (searchLower) {
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== "ALL" && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== "ALL" && task.priority !== filters.priority) {
        return false;
      }

      // Assignee filter
      if (filters.assignee !== "ALL") {
        if (filters.assignee === "") {
          // Filter for unassigned tasks
          if (task.assigneeId !== null) {
            return false;
          }
        } else {
          // Filter for specific assignee
          if (task.assigneeId !== filters.assignee) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tasks, filters]);

  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (newStatus: TaskStatus) => {
    if (!draggedTask) return;

    if (draggedTask.status !== newStatus) {
      try {
        await updateTaskAction(draggedTask.id, { status: newStatus });
        setTasks((prev) =>
          prev.map((t) => (t.id === draggedTask.id ? { ...t, status: newStatus } : t))
        );
        showNotification(`Task moved to ${STATUS_LABELS[newStatus]}`, "success");
      } catch (error) {
        showNotification("Failed to update task", "error");
        console.error("Error updating task:", error);
      }
    }

    setDraggedTask(null);
  }, [draggedTask, showNotification]);

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((t) => t.status === status);
  };

  // Memoized member lookup maps for O(1) access
  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach(m => map.set(m.id, m.name));
    return map;
  }, [members]);

  const getAssigneeName = useCallback((task: Task) => {
    return memberMap.get(task.assigneeId || "") || undefined;
  }, [memberMap]);

  const getCreatorName = useCallback((task: Task) => {
    return memberMap.get(task.createdById) || undefined;
  }, [memberMap]);

  const totalTasks = filteredTasks.length;
  const hasTasks = totalTasks > 0;

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 animate-fade-in max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="space-y-2">
              <div className="h-7 sm:h-8 w-48 bg-gray-800 rounded-lg animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="bg-gray-900/50 border border-purple-500/20 rounded-lg p-3 sm:p-4">
            <div className="h-10 bg-gray-800 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <KanbanColumnSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 animate-fade-in max-w-7xl">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 sm:p-8 text-center animate-fade-in-scale">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-2">Something went wrong</h3>
            <p className="text-red-300 mb-6 text-sm sm:text-base">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={loadData}
                className="px-6 py-3 bg-red-900 hover:bg-red-950 rounded-lg text-gray-200 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-900/10 hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 font-medium transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 animate-fade-in max-w-7xl">
      {/* Notification */}
      {notification && (
        <div className="mb-3 sm:mb-4 animate-slide-down">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />
        </div>
      )}

      {/* Header with Filters */}
      <div className="mb-4 sm:mb-5 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-200">Task Board</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {totalTasks} {totalTasks === 1 ? "task" : "tasks"} total
            </p>
          </div>
        </div>
        <TaskFilters onFilterChange={handleFilterChange} members={members} />
      </div>

      <div className="w-full">
        {/* Kanban Board */}
        <div className="w-full">
          {hasTasks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto pb-4 lg:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0">
              {STATUSES.map((status, index) => {
                const statusTasks = getTasksByStatus(status);
                return (
                  <div
                    key={status}
                    className="flex flex-col animate-fade-in-scale"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(status)}
                  >
                    <div className={`p-2.5 sm:p-3 lg:p-4 rounded-t-lg border ${STATUS_COLORS[status]} flex items-center justify-between`}>
                      <h3 className="font-semibold text-xs sm:text-sm lg:text-base text-gray-200 truncate flex items-center gap-2">
                        {status === 'TO_DO' && ' 📋'}
                        {status === 'IN_PROGRESS' && ' ⚙️'}
                        {status === 'DONE' && ' ✅'}
                        {status === 'BLOCKED' && ' 🚫'}
                        {STATUS_LABELS[status]}
                      </h3>
                      <span className="text-xs sm:text-sm font-bold text-gray-200 bg-black/20 px-2 py-0.5 rounded-full">
                        {statusTasks.length}
                      </span>
                    </div>
                    <div className="flex-1 min-h-[250px] sm:min-h-[350px] lg:min-h-[450px] p-2 sm:p-3 bg-gray-900/50 border-x border-b border-purple-500/20 rounded-b-lg space-y-2 sm:space-y-3 overflow-y-auto max-h-[500px] sm:max-h-[600px] lg:max-h-[700px] transition-all duration-300">
                      {statusTasks.map((task, taskIndex) => (
                        <div
                          key={task.id}
                          className="animate-fade-in-scale"
                          style={{ animationDelay: `${taskIndex * 30}ms` }}
                        >
                          <TaskCard
                            task={task}
                            assigneeName={getAssigneeName(task)}
                            onDragStart={handleDragStart}
                            onClick={() => setSelectedTask(task)}
                          />
                        </div>
                      ))}
                      {statusTasks.length === 0 && (
                        <EmptyState
                          icon="📭"
                          title="No tasks"
                          description={`No tasks in ${STATUS_LABELS[status].toLowerCase()}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="🚀"
              title="No tasks yet"
              description={
                currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER')
                  ? "Get started by creating your first task using the AI assistant or the quick add button."
                  : "No tasks assigned to you yet. Check back later or contact your manager."
              }
              action={
                currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER')
                  ? {
                      label: "Create Task",
                      onClick: () => {
                        const fab = document.querySelector('button[aria-label="Add new task"]') as HTMLButtonElement;
                        fab?.click();
                      },
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      ),
                    }
                  : undefined
              }
              secondaryAction={
                currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER')
                  ? {
                      label: "Chat with AI",
                      onClick: () => {
                        const aiFab = document.querySelector('button[aria-label="Open AI Assistant"]') as HTMLButtonElement;
                        aiFab?.click();
                      },
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      ),
                    }
                  : undefined
              }
            />
          )}
        </div>

      </div>

      {/* AI Chat FAB - Only for Admin/Owner/Manager */}
      {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') && (
        <AIChatFAB />
      )}

      {/* Quick Add Task - Only for Admin/Owner/Manager */}
      {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') && (
        <QuickAddTask
          members={members}
          onTaskCreated={() => {
            loadData();
          }}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          assigneeName={getAssigneeName(selectedTask)}
          creatorName={getCreatorName(selectedTask)}
          members={members}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            loadData();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
