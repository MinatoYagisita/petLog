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

interface PlaceListing {
  id: string;
  name: string;
  type: string;
  status: string;
  phone: string | null;
  address: string | null;
  adminNote: string | null;
  createdAt: string;
}

interface PlaceAccount {
  id: string;
  email: string;
  accountType: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "審査中",
  approved: "掲載中",
  rejected: "非承認",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50",
  approved: "text-green-700 bg-green-50",
  rejected: "text-red-600 bg-red-50",
};

export default function PlaceDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<PlaceAccount | null>(null);
  const [listings, setListings] = useState<PlaceListing[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    user.getIdToken().then(async (token) => {
      const [accRes, listRes] = await Promise.all([
        fetch("/api/place-accounts/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/place-listings/mine", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!accRes.ok) { router.replace("/login"); return; }
      const [acc, list] = await Promise.all([accRes.json(), listRes.ok ? listRes.json() : []]);
      setAccount(acc);
      setListings(list);
      setFetching(false);
    }).catch(() => router.replace("/login"));
  }, [user, loading, router]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  if (loading || fetching) return <PageSpinner />;
  if (!account) return null;

  const typeLabel = account.accountType === "hospital" ? "動物病院" : "トリミングサロン";

  return (
    <div className="min-h-screen bg-app-bg px-4 pt-6 pb-12 max-w-[480px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">施設ダッシュボード</h1>
          <p className="text-sm text-text-secondary">{typeLabel} · {account.email}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-text-secondary">
          ログアウト
        </button>
      </div>

      <Button
        fullWidth
        onClick={() => router.push("/place-apply")}
        className="mb-6"
      >
        + 新規掲載申請
      </Button>

      <h2 className="text-base font-semibold text-text-primary mb-3">申請一覧</h2>

      {listings.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary text-center py-4">
            まだ申請がありません
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((l) => (
            <Card key={l.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{l.name}</p>
                  {l.phone && <p className="text-sm text-text-secondary">{l.phone}</p>}
                  {l.address && <p className="text-xs text-text-secondary mt-0.5 truncate">{l.address}</p>}
                  {l.status === "rejected" && l.adminNote && (
                    <p className="text-xs text-red-600 mt-1">理由: {l.adminNote}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[l.status] ?? ""}`}>
                  {STATUS_LABEL[l.status] ?? l.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
