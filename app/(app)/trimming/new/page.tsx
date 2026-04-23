"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import toast from "react-hot-toast";

interface Salon {
  id: string;
  name: string;
}

export default function NewTrimmingPage() {
  const { user } = useAuth();
  const { activePet } = usePets();
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonId, setSalonId] = useState("");
  const [salonName, setSalonName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(today);
  const [completedDate, setCompletedDate] = useState("");
  const [content, setContent] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [nextScheduledDate, setNextScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<Salon[]>("/api/salons", user).then(setSalons).catch(() => {});
  }, [user]);

  function handleSalonSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSalonId(id);
    if (id) {
      const s = salons.find((s) => s.id === id);
      setSalonName(s?.name ?? "");
    } else {
      setSalonName("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activePet) return;
    setLoading(true);
    try {
      await api.post("/api/trimming", user, {
        petId: activePet.id,
        salonId: salonId || undefined,
        salonName: salonName || undefined,
        scheduledDate,
        completedDate: completedDate || undefined,
        content: content || undefined,
        cost: cost ? parseInt(cost) : undefined,
        note: note || undefined,
        nextScheduledDate: nextScheduledDate || undefined,
      });
      toast.success("登録しました");
      router.push("/trimming");
    } catch {
      toast.error("登録できませんでした");
    } finally {
      setLoading(false);
    }
  }

  if (!activePet) {
    return (
      <div className="px-4 pt-6">
        <Card className="text-center py-12">
          <p className="text-text-secondary">先にペットを登録してください</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary">トリミング登録</h1>
      </div>
      <p className="text-sm text-text-secondary -mt-2">{activePet.name}</p>

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
            placeholder="例: ○○ペットサロン"
          />

          <div className="border-t border-border pt-4 flex flex-col gap-4">
            <p className="text-sm font-medium text-text-primary">完了後に入力（任意）</p>
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
              placeholder="例: シャンプー・カット・爪切り"
            />
            <Input
              label="費用（円）"
              type="number"
              min={0}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="例: 5000"
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

          <Button type="submit" loading={loading} fullWidth>
            登録する
          </Button>
        </form>
      </Card>
    </div>
  );
}
