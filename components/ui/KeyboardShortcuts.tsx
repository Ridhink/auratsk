"use client";

import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onQuickAdd: () => void;
  onSearch: () => void;
}

export function useKeyboardShortcuts({ onQuickAdd, onSearch }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onSearch();
      }

      // Ctrl/Cmd + N for new task
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        onQuickAdd();
      }

      // Escape to close modals
      if (e.key === "Escape") {
        // This will be handled by individual components
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onQuickAdd, onSearch]);
}

export function KeyboardShortcutsHelp() {
  return (
    <div className="fixed bottom-4 left-4 bg-gray-900/90 border border-purple-500/20 rounded-lg p-4 text-sm text-gray-300 z-30">
      <div className="font-semibold text-white mb-2">Keyboard Shortcuts</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">⌘</kbd>
          <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">N</kbd>
          <span className="ml-2">New Task</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">⌘</kbd>
          <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">K</kbd>
          <span className="ml-2">Search</span>
        </div>
      </div>
    </div>
  );
}

