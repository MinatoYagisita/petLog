import { clsx, type ClassValue } from "clsx";
import { format, startOfDay, endOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "yyyy/MM/dd");
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "yyyy/MM/dd HH:mm");
}

export function todayRange() {
  const now = new Date();
  return { gte: startOfDay(now), lte: endOfDay(now) };
}

export const MED_STATUS_LABEL: Record<string, string> = {
  scheduled: "予定",
  pending: "未実施",
  done: "完了",
  skipped: "スキップ",
  failed: "失敗",
  delayed: "遅延",
};

export const MED_STATUS_COLOR: Record<string, string> = {
  scheduled: "text-[#6B7280] bg-[#F3F4F6]",
  pending: "text-[#B45309] bg-[#FEF3C7]",
  done: "text-[#16A34A] bg-[#DCFCE7]",
  skipped: "text-[#6B7280] bg-[#F3F4F6]",
  failed: "text-[#DC2626] bg-[#FEE2E2]",
  delayed: "text-[#D97706] bg-[#FEF3C7]",
};
