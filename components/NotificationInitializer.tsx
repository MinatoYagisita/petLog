"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { requestFcmToken, setupForegroundHandler } from "@/lib/firebase-messaging";
import { api } from "@/lib/api-client";

export function NotificationInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let cleanupForeground: (() => void) | undefined;

    async function init() {
      try {
        const token = await requestFcmToken();
        if (!token) return;
        if (!user) return;
        await api.post("/api/notifications/token", user, { token });
        cleanupForeground = setupForegroundHandler();
      } catch {
        // 通知は任意機能なのでエラーは無視
      }
    }

    init();
    return () => { cleanupForeground?.(); };
  }, [user]);

  return null;
}
