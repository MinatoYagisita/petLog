"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

interface Hospital {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
}

export default function HospitalsPage() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const data = await api.get<Hospital[]>("/api/hospitals", user).catch(() => [] as Hospital[]);
    setHospitals(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  async function handleDelete(h: Hospital) {
    if (!user) return;
    if (!confirm(`「${h.name}」を削除しますか？`)) return;
    setDeletingId(h.id);
    try {
      await api.delete(`/api/hospitals/${h.id}`, user);
      toast.success("削除しました");
      setHospitals((prev) => prev.filter((x) => x.id !== h.id));
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
        <h1 className="text-xl font-bold text-text-primary">病院管理</h1>
        <Link href="/hospitals/new">
          <Button size="sm">+ 追加</Button>
        </Link>
      </div>

      {hospitals.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary text-sm mb-4">登録された病院はありません</p>
          <Link href="/hospitals/new">
            <Button variant="secondary" size="sm">病院を登録する</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {hospitals.map((h) => (
            <Card key={h.id} className="flex items-start gap-3">
              <div className="text-2xl">🏥</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{h.name}</p>
                {h.phone && <p className="text-sm text-text-secondary">{h.phone}</p>}
                {h.note && <p className="text-xs text-text-secondary mt-0.5">{h.note}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/hospitals/${h.id}/edit`} className="text-sm text-primary font-medium">
                  編集
                </Link>
                <button
                  onClick={() => handleDelete(h)}
                  disabled={deletingId === h.id}
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
