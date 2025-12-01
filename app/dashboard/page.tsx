"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchTasks, updateTaskAction, fetchMembers } from "@/lib/db/actions";
import type { Task } from "@/lib/db/schema";
import AIChatBox from "@/components/ai/AIChatBox";
import TaskFilters, { type FilterState } from "@/components/tasks/TaskFilters";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import QuickAddTask from "@/components/tasks/QuickAddTask";
import EmptyState from "@/components/ui/EmptyState";
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
  IN_PROGRESS: "border-purple-500 bg-purple-900/20",
  DONE: "border-teal-500 bg-teal-900/20",
  BLOCKED: "border-red-500 bg-red-900/20",
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
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="flex flex-col items-center gap-4 animate-bounce-in">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white animate-pulse">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
          <p>Error: {error}</p>
          <button
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 animate-fade-in">
      {/* Notification */}
      {notification && (
        <div className="mb-4 animate-slide-down">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />
        </div>
      )}

      {/* Header with Filters */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">Task Board</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {totalTasks} {totalTasks === 1 ? "task" : "tasks"} total
            </p>
          </div>
        </div>
        <TaskFilters onFilterChange={handleFilterChange} members={members} />
      </div>

      <div className={`grid grid-cols-1 ${currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-4 lg:gap-8`}>
        {/* Kanban Board */}
        <div className={currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') ? "lg:col-span-2 order-2 lg:order-1" : "order-1"}>
          {hasTasks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 overflow-x-auto pb-4 lg:pb-0">
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
                    <div className={`p-2 sm:p-3 rounded-t-lg border ${STATUS_COLORS[status]}`}>
                      <h3 className="font-semibold text-xs sm:text-sm text-white truncate">
                        {STATUS_LABELS[status]} ({statusTasks.length})
                      </h3>
                    </div>
                    <div className="flex-1 min-h-[300px] sm:min-h-[400px] p-2 bg-gray-900/50 border-x border-b border-purple-500/20 rounded-b-lg space-y-2 overflow-y-auto max-h-[600px] transition-all duration-300">
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
                  : "No tasks assigned to you yet."
              }
            />
          )}
        </div>

        {/* AI Chat Box - Only for Admin/Owner/Manager */}
        {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') && (
          <div className="lg:col-span-1 order-1 lg:order-2 animate-fade-in animate-slide-in-right" style={{ animationDelay: '100ms' }}>
            <div className="sticky top-4 lg:top-8 h-auto lg:h-[calc(100vh-8rem)] max-h-[600px] lg:max-h-none">
              <AIChatBox />
            </div>
          </div>
        )}
      </div>

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
