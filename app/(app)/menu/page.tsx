"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const menuItems = [
  { href: "/trimming", emoji: "✂️", label: "トリミング", desc: "予約・記録を管理" },
  { href: "/hospitals", emoji: "🏥", label: "病院", desc: "かかりつけ病院の管理" },
  { href: "/salons", emoji: "💅", label: "サロン", desc: "かかりつけサロンの管理" },
  { href: "/prescriptions", emoji: "📋", label: "お薬手帳", desc: "処方履歴の確認" },
  { href: "/pets", emoji: "🐾", label: "ペット管理", desc: "プロフィール・追加" },
  { href: "/settings", emoji: "⚙️", label: "設定", desc: "通知・アカウント設定" },
];

export default function MenuPage() {
  const router = useRouter();
  return (
    <div className="px-4 pt-6 pb-8 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">メニュー</h1>

      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center gap-4 px-4 py-4 bg-surface rounded-xl border border-border hover:border-primary transition-colors active:scale-[0.98]">
              <span className="text-2xl w-9 text-center">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm">{item.label}</p>
                <p className="text-xs text-text-secondary">{item.desc}</p>
              </div>
              <span className="text-text-secondary text-sm">›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
