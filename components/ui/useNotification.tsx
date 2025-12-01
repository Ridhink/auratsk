"use client";

import { useState, useCallback } from "react";

export interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
  id: string;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotification({ message, type, id });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    clearNotification,
  };
}

