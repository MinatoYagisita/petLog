"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function NewMedicationPage() {
  const { user } = useAuth();
  const { activePet } = usePets();
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [times, setTimes] = useState(["08:00"]);
  const [loading, setLoading] = useState(false);

  function addTime() {
    setTimes([...times, "08:00"]);
  }

  function removeTime(i: number) {
    setTimes(times.filter((_, idx) => idx !== i));
  }

  function updateTime(i: number, val: string) {
    const next = [...times];
    next[i] = val;
    setTimes(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activePet) return;
    if (times.length === 0) {
      toast.error("投薬時間を少なくとも1つ設定してください");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/medications", user, {
        petId: activePet.id,
        name,
        startDate,
        endDate: endDate || undefined,
        times,
      });
      toast.success(`${name} を登録しました`);
      router.push("/medications");
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
        <h1 className="text-xl font-bold text-text-primary">投薬登録</h1>
      </div>
      <p className="text-sm text-text-secondary -mt-2">{activePet.name}</p>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="薬の名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: フロントライン"
            required
          />

          <div className="flex gap-3">
            <Input
              label="開始日"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="終了日（任意）"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text-primary">
              投薬時間 <span className="text-danger">*</span>
            </p>
            {times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={t}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(i)}
                    className="text-danger text-sm px-2"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addTime}>
              + 時間を追加
            </Button>
          </div>

          <Button type="submit" loading={loading} fullWidth>
            登録する
          </Button>
        </form>
      </Card>
    </div>
  );
}
