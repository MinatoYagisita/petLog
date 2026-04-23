"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

interface Salon {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
}

export default function SalonsPage() {
  const { user } = useAuth();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const data = await api.get<Salon[]>("/api/salons", user).catch(() => [] as Salon[]);
    setSalons(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  async function handleDelete(s: Salon) {
    if (!user) return;
    if (!confirm(`「${s.name}」を削除しますか？`)) return;
    setDeletingId(s.id);
    try {
      await api.delete(`/api/salons/${s.id}`, user);
      toast.success("削除しました");
      setSalons((prev) => prev.filter((x) => x.id !== s.id));
    } catch {
      toast.error("削除できませんでした");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">サロン管理</h1>
        <Link href="/salons/new">
          <Button size="sm">+ 追加</Button>
        </Link>
      </div>

      {salons.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary text-sm mb-4">登録されたサロンはありません</p>
          <Link href="/salons/new">
            <Button variant="secondary" size="sm">サロンを登録する</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {salons.map((s) => (
            <Card key={s.id} className="flex items-start gap-3">
              <div className="text-2xl">✂️</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{s.name}</p>
                {s.phone && <p className="text-sm text-text-secondary">{s.phone}</p>}
                {s.note && <p className="text-xs text-text-secondary mt-0.5">{s.note}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/salons/${s.id}/edit`} className="text-sm text-primary font-medium">
                  編集
                </Link>
                <button
                  onClick={() => handleDelete(s)}
                  disabled={deletingId === s.id}
                  className="text-sm text-danger"
                >
                  削除
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
