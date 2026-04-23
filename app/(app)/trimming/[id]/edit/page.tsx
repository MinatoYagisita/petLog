"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

interface Salon {
  id: string;
  name: string;
}

interface Trimming {
  id: string;
  salonId: string | null;
  salonName: string | null;
  scheduledDate: string;
  completedDate: string | null;
  content: string | null;
  cost: number | null;
  note: string | null;
  nextScheduledDate: string | null;
}

export default function EditTrimmingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonId, setSalonId] = useState("");
  const [salonName, setSalonName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [completedDate, setCompletedDate] = useState("");
  const [content, setContent] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [nextScheduledDate, setNextScheduledDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;
    Promise.all([
      api.get<Trimming>(`/api/trimming/${params.id}`, user),
      api.get<Salon[]>("/api/salons", user).catch(() => [] as Salon[]),
    ]).then(([t, s]) => {
      setSalons(s);
      setSalonId(t.salonId ?? "");
      setSalonName(t.salonName ?? "");
      setScheduledDate(t.scheduledDate.split("T")[0]);
      setCompletedDate(t.completedDate ? t.completedDate.split("T")[0] : "");
      setContent(t.content ?? "");
      setCost(t.cost != null ? String(t.cost) : "");
      setNote(t.note ?? "");
      setNextScheduledDate(t.nextScheduledDate ? t.nextScheduledDate.split("T")[0] : "");
    }).catch(() => toast.error("読み込めませんでした"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  function handleSalonSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSalonId(id);
    if (id) {
      const s = salons.find((s) => s.id === id);
      setSalonName(s?.name ?? "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await api.patch(`/api/trimming/${params.id}`, user, {
        salonId: salonId || null,
        salonName: salonName || null,
        scheduledDate,
        completedDate: completedDate || null,
        content: content || null,
        cost: cost ? parseInt(cost) : null,
        note: note || null,
        nextScheduledDate: nextScheduledDate || null,
      });
      toast.success("更新しました");
      router.push("/trimming");
    } catch {
      toast.error("更新できませんでした");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary">トリミング編集</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="予定日"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
          />

          {salons.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">サロンを選択</label>
              <select
                value={salonId}
                onChange={handleSalonSelect}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">直接入力する</option>
                {salons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="サロン名（任意）"
            value={salonName}
            onChange={(e) => { setSalonName(e.target.value); setSalonId(""); }}
          />

          <div className="border-t border-border pt-4 flex flex-col gap-4">
            <p className="text-sm font-medium text-text-primary">完了情報</p>
            <Input
              label="実施日"
              type="date"
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
            />
            <TextArea
              label="施術内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Input
              label="費用（円）"
              type="number"
              min={0}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
            <Input
              label="次回予定日"
              type="date"
              value={nextScheduledDate}
              onChange={(e) => setNextScheduledDate(e.target.value)}
            />
          </div>

          <TextArea
            label="メモ（任意）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button type="submit" loading={saving} fullWidth>
            保存する
          </Button>
        </form>
      </Card>
    </div>
  );
}
