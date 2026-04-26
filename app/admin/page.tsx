"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

const ADMIN_EMAIL = "minato.yagishita@gmail.com";

interface Listing {
  id: string;
  type: string;
  name: string;
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  account: { email: string; accountType: string };
}

type StatusFilter = "pending" | "approved" | "rejected" | "all";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.email !== ADMIN_EMAIL) { router.replace("/dashboard"); return; }
  }, [user, loading, router]);

  async function fetchListings(status: StatusFilter) {
    if (!user) return;
    setFetching(true);
    const token = await user.getIdToken();
    const res = await fetch(`/api/admin/place-listings?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setListings(await res.json());
    setFetching(false);
  }

  useEffect(() => {
    if (!user || loading) return;
    if (user.email !== ADMIN_EMAIL) return;
    fetchListings(filter);
  }, [user, loading, filter]);

  async function decide(id: string, status: "approved" | "rejected") {
    if (!user) return;
    setProcessing(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/place-listings/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: noteMap[id] ?? null }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "approved" ? "承認しました" : "非承認にしました");
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) return <PageSpinner />;

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "pending", label: "審査中" },
    { key: "approved", label: "掲載中" },
    { key: "rejected", label: "非承認" },
    { key: "all", label: "全て" },
  ];

  return (
    <div className="min-h-screen bg-app-bg px-4 pt-6 pb-12 max-w-[480px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">管理画面</h1>
        <button
          onClick={async () => { await signOut(auth); router.replace("/login"); }}
          className="text-sm text-text-secondary"
        >
          ログアウト
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
              filter === f.key
                ? "bg-primary text-text-primary"
                : "bg-surface border border-border text-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {fetching ? (
        <PageSpinner />
      ) : listings.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary text-center py-4">該当なし</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {listings.map((l) => (
            <Card key={l.id}>
              <div className="flex gap-3">
                {l.photoUrl && (
                  <img
                    src={l.photoUrl}
                    alt={l.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-text-primary truncate">{l.name}</p>
                    <span className="text-xs text-text-secondary flex-shrink-0">
                      {l.type === "hospital" ? "病院" : "サロン"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{l.account.email}</p>
                  {l.phone && <p className="text-sm text-text-secondary mt-0.5">{l.phone}</p>}
                  {l.address && <p className="text-xs text-text-secondary mt-0.5 truncate">{l.address}</p>}
                  {l.lat && l.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${l.lat},${l.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline mt-0.5 inline-block"
                    >
                      Googleマップで確認
                    </a>
                  )}
                </div>
              </div>

              {l.status === "pending" && (
                <div className="mt-3 border-t border-border pt-3">
                  <textarea
                    placeholder="非承認の場合、理由を入力（任意）"
                    value={noteMap[l.id] ?? ""}
                    onChange={(e) => setNoteMap((p) => ({ ...p, [l.id]: e.target.value }))}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2 mb-3 bg-app-bg text-text-primary resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => decide(l.id, "approved")}
                      loading={processing === l.id}
                      className="flex-1"
                    >
                      承認
                    </Button>
                    <button
                      onClick={() => decide(l.id, "rejected")}
                      disabled={processing === l.id}
                      className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      非承認
                    </button>
                  </div>
                </div>
              )}

              {l.status !== "pending" && (
                <div className="mt-2 text-xs text-text-secondary">
                  {l.status === "approved" ? "✅ 掲載中" : `❌ 非承認${l.adminNote ? ` — ${l.adminNote}` : ""}`}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
