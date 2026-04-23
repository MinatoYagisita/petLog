"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Toggle } from "@/components/ui/Toggle";
import { api } from "@/lib/api-client";

interface SettingLink {
  href: string;
  icon: string;
  label: string;
  description: string;
}

const navSections: { title: string; items: SettingLink[] }[] = [
  {
    title: "ペット管理",
    items: [
      { href: "/pets", icon: "🐾", label: "ペット一覧", description: "ペットの登録・編集・削除" },
    ],
  },
  {
    title: "マスタ管理",
    items: [
      { href: "/hospitals", icon: "🏥", label: "病院管理", description: "通院先の病院を管理" },
      { href: "/salons", icon: "✂️", label: "サロン管理", description: "トリミングサロンを管理" },
    ],
  },
  {
    title: "記録",
    items: [
      { href: "/prescriptions", icon: "💊", label: "お薬手帳", description: "処方履歴を確認" },
      { href: "/trimming", icon: "✂️", label: "トリミング記録", description: "トリミング予定・履歴を確認" },
    ],
  },
];

interface NotifSettings {
  medReminder: boolean;
  medOverdue: boolean;
  stockAlert: boolean;
  visitReminder: boolean;
  trimmingReminder: boolean;
  healthPrompt: boolean;
  stockThreshold: number;
}

const NOTIF_DEFAULTS: NotifSettings = {
  medReminder: true,
  medOverdue: true,
  stockAlert: true,
  visitReminder: true,
  trimmingReminder: true,
  healthPrompt: false,
  stockThreshold: 7,
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notif, setNotif] = useState<NotifSettings>(NOTIF_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get<NotifSettings>("/api/notifications/settings", user)
      .then(setNotif)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function toggle(key: keyof NotifSettings, value: boolean | number) {
    if (!user) return;
    const updated = { ...notif, [key]: value };
    setNotif(updated);
    await api.patch("/api/notifications/settings", user, { [key]: value }).catch(() => {});
  }

  const notifItems: { key: keyof NotifSettings; label: string; description: string }[] = [
    { key: "medReminder", label: "投薬リマインド", description: "投薬時間の5分前に通知" },
    { key: "medOverdue", label: "未対応投薬アラート", description: "投薬時間から1時間後に通知" },
    { key: "stockAlert", label: "薬残量アラート", description: "残量が少なくなったら通知" },
    { key: "visitReminder", label: "通院リマインド", description: "通院予定の前日・当日に通知" },
    { key: "trimmingReminder", label: "トリミングリマインド", description: "トリミング予定の前日・当日に通知" },
    { key: "healthPrompt", label: "健康記録の入力促し", description: "未入力の日に通知（デフォルトOFF）" },
  ];

  return (
    <div className="px-4 pt-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">設定</h1>

      {/* Notification settings */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          通知設定
        </h2>
        <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-border">
          {notifItems.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center gap-3 bg-surface px-4 py-3 ${
                i < notifItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-secondary">{item.description}</p>
              </div>
              <Toggle
                checked={notif[item.key] as boolean}
                onChange={(v) => toggle(item.key, v)}
                disabled={loading}
              />
            </div>
          ))}
          {/* Stock threshold */}
          <div className="flex items-center gap-3 bg-surface px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">残量アラートのしきい値</p>
              <p className="text-xs text-text-secondary">残り何日分を下回ったら通知するか</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={notif.stockThreshold}
                onChange={(e) => toggle("stockThreshold", Number(e.target.value))}
                disabled={loading}
                className="w-14 text-center border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-text-secondary">日</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation sections */}
      {navSections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            {section.title}
          </h2>
          <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-border">
            {section.items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 bg-surface px-4 py-3 hover:bg-app-bg transition-colors ${
                  i < section.items.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary">{item.description}</p>
                </div>
                <span className="text-text-secondary">›</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          アカウント
        </h2>
        <div className="rounded-xl overflow-hidden border border-border">
          <button
            onClick={async () => { await logout(); router.replace("/login"); }}
            className="w-full flex items-center gap-3 bg-surface px-4 py-3 hover:bg-app-bg transition-colors text-left"
          >
            <span className="text-xl">🚪</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-danger">ログアウト</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
