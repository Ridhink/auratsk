"use client";

import { memo, useCallback } from "react";
import type { Task } from "@/lib/db/schema";
import { formatDistanceToNow } from "date-fns";

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  onDragStart?: (task: Task) => void;
  onClick?: () => void;
}

const PRIORITY_COLORS = {
  LOW: "border-blue-500/30 bg-blue-900/10",
  MEDIUM: "border-gray-500/30 bg-gray-800/50",
  HIGH: "border-orange-500/30 bg-orange-900/10",
  URGENT: "border-red-500/30 bg-red-900/10",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function TaskCard({ task, assigneeName, onDragStart, onClick }: TaskCardProps) {
  const priorityColor = task.priority ? PRIORITY_COLORS[task.priority] : PRIORITY_COLORS.MEDIUM;
  const priorityLabel = task.priority ? PRIORITY_LABELS[task.priority] : "Medium";

  const handleDragStart = useCallback(() => {
    onDragStart?.(task);
  }, [onDragStart, task]);

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`p-2 sm:p-3 bg-gray-800 border ${priorityColor} rounded-lg hover:border-purple-500/40 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 group animate-fade-in ${
        onDragStart ? "cursor-move" : onClick ? "cursor-pointer" : ""
      }`}
      style={{ animationDelay: '0ms' }}
    >
      {/* Priority Badge */}
      {task.priority && task.priority !== "MEDIUM" && (
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            task.priority === "URGENT" ? "bg-red-600 text-white" :
            task.priority === "HIGH" ? "bg-orange-600 text-white" :
            "bg-blue-600 text-white"
          }`}>
            {priorityLabel}
          </span>
        </div>
      )}

      <h4 className="font-medium text-white text-sm mb-1 group-hover:text-purple-300 transition-colors">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{task.dueDate}</span>
        </div>
        {assigneeName && (
          <span className="text-gray-400">@{assigneeName.split(" ")[0]}</span>
        )}
      </div>

      {task.createdAt && (
        <div className="text-xs text-gray-600 mt-1">
          {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
        </div>
      )}
    </div>
  );
}

export default memo(TaskCard);
