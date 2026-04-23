"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { PetSelector } from "@/components/features/pets/PetSelector";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Trimming {
  id: string;
  salonName: string | null;
  scheduledDate: string;
  completedDate: string | null;
  content: string | null;
  cost: number | null;
  note: string | null;
  nextScheduledDate: string | null;
}

export default function TrimmingPage() {
  const { user } = useAuth();
  const { activePet } = usePets();
  const [trimmings, setTrimmings] = useState<Trimming[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !activePet) return;
    setLoading(true);
    api.get<Trimming[]>(`/api/trimming?petId=${activePet.id}`, user)
      .then(setTrimmings)
      .catch(() => toast.error("読み込めませんでした"))
      .finally(() => setLoading(false));
  }, [user, activePet?.id]);

  async function handleDelete(t: Trimming) {
    if (!user) return;
    if (!confirm("このトリミング記録を削除しますか？")) return;
    setDeletingId(t.id);
    try {
      await api.delete(`/api/trimming/${t.id}`, user);
      toast.success("削除しました");
      setTrimmings((prev) => prev.filter((x) => x.id !== t.id));
    } catch {
      toast.error("削除できませんでした");
    } finally {
      setDeletingId(null);
    }
  }

  const scheduled = trimmings.filter((t) => !t.completedDate);
  const completed = trimmings.filter((t) => t.completedDate);

  if (loading) return <PageSpinner />;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">トリミング</h1>
        <Link href="/trimming/new">
          <Button size="sm">+ 登録</Button>
        </Link>
      </div>

      <PetSelector />

      {!activePet ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary text-sm">先にペットを登録してください</p>
        </Card>
      ) : trimmings.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary text-sm mb-4">記録がありません</p>
          <Link href="/trimming/new">
            <Button variant="secondary" size="sm">トリミングを登録する</Button>
          </Link>
        </Card>
      ) : (
        <>
          {scheduled.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">予定</h2>
              <div className="flex flex-col gap-2">
                {scheduled.map((t) => (
                  <Card key={t.id} className="flex items-start gap-3">
                    <div className="text-2xl">✂️</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary">
                        {t.salonName ?? "サロン未設定"}
                      </p>
                      <p className="text-sm text-text-secondary">予定日: {formatDate(t.scheduledDate)}</p>
                      {t.note && <p className="text-xs text-text-secondary mt-0.5">{t.note}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-[#E0F2FE] text-[#0369A1]">予定</Badge>
                      <div className="flex gap-2">
                        <Link href={`/trimming/${t.id}/edit`} className="text-xs text-primary font-medium">
                          編集
                        </Link>
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={deletingId === t.id}
                          className="text-xs text-danger"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">完了</h2>
              <div className="flex flex-col gap-2">
                {completed.map((t) => (
                  <Card key={t.id} className="flex items-start gap-3">
                    <div className="text-2xl">✂️</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary">
                        {t.salonName ?? "サロン未設定"}
                      </p>
                      <p className="text-sm text-text-secondary">実施日: {formatDate(t.completedDate!)}</p>
                      {t.content && <p className="text-xs text-text-secondary mt-0.5">{t.content}</p>}
                      {t.cost != null && (
                        <p className="text-xs text-text-secondary">¥{t.cost.toLocaleString()}</p>
                      )}
                      {t.nextScheduledDate && (
                        <p className="text-xs text-text-secondary">
                          次回予定: {formatDate(t.nextScheduledDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-[#DCFCE7] text-[#16A34A]">完了</Badge>
                      <div className="flex gap-2">
                        <Link href={`/trimming/${t.id}/edit`} className="text-xs text-primary font-medium">
                          編集
                        </Link>
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={deletingId === t.id}
                          className="text-xs text-danger"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
