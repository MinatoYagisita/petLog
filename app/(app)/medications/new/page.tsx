"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";

function Stepper({
  label,
  value,
  onChange,
  step = 0.5,
  min = 0,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
  min?: number;
  placeholder?: string;
}) {
  function adjust(delta: number) {
    const current = parseFloat(value) || 0;
    const next = Math.max(min, Math.round((current + delta) * 10) / 10);
    onChange(String(next));
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="w-9 h-9 rounded-xl border border-border bg-surface text-lg font-bold text-text-secondary hover:bg-app-bg flex items-center justify-center flex-shrink-0"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => adjust(step)}
          className="w-9 h-9 rounded-xl border border-border bg-surface text-lg font-bold text-text-secondary hover:bg-app-bg flex items-center justify-center flex-shrink-0"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

export default function NewMedicationPage() {
  const { user } = useAuth();
  const { activePet } = usePets();
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [times, setTimes] = useState(["08:00"]);
  const [stockCount, setStockCount] = useState("");
  const [doseAmount, setDoseAmount] = useState("");
  const [stockUnit, setStockUnit] = useState("錠");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const remainingDays =
    stockCount && doseAmount && times.length > 0
      ? Math.floor(parseFloat(stockCount) / (parseFloat(doseAmount) * times.length))
      : null;

  function addTime() { setTimes([...times, "08:00"]); }
  function removeTime(i: number) { setTimes(times.filter((_, idx) => idx !== i)); }
  function updateTime(i: number, val: string) {
    const next = [...times];
    next[i] = val;
    setTimes(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activePet) return;
    if (times.length === 0) { toast.error("投薬時間を少なくとも1つ設定してください"); return; }
    setLoading(true);
    try {
      await api.post("/api/medications", user, {
        petId: activePet.id,
        name,
        startDate,
        endDate: endDate || undefined,
        times,
        stockCount: stockCount ? parseFloat(stockCount) : undefined,
        doseAmount: doseAmount ? parseFloat(doseAmount) : undefined,
        stockUnit: stockUnit || undefined,
        note: note || undefined,
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
        <button onClick={() => router.back()} className="text-text-secondary">← 戻る</button>
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
            <Input label="開始日" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input label="終了日（任意）" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
                  <button type="button" onClick={() => removeTime(i)} className="text-danger text-sm px-2">削除</button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addTime}>+ 時間を追加</Button>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">残量管理（任意）</p>
              {remainingDays !== null && (
                <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                  残り約 {remainingDays} 日分
                </span>
              )}
            </div>

            <Select label="単位" value={stockUnit} onChange={(e) => setStockUnit(e.target.value)}>
              <option value="錠">錠</option>
              <option value="ml">ml</option>
              <option value="">その他</option>
            </Select>

            <Stepper
              label={`総量（${stockUnit || "個"}）`}
              value={stockCount}
              onChange={setStockCount}
              step={1}
              placeholder="例: 30"
            />
            <Stepper
              label={`1回の量（${stockUnit || "個"}）`}
              value={doseAmount}
              onChange={setDoseAmount}
              step={0.5}
              placeholder="例: 1"
            />
          </div>

          <TextArea
            label="メモ（任意）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例: 食後に与える"
          />

          <Button type="submit" loading={loading} fullWidth>登録する</Button>
        </form>
      </Card>
    </div>
  );
}
