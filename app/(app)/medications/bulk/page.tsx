"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";

interface MedRow {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  times: string[];
  stockCount: string;
  doseAmount: string;
  stockUnit: string;
}

let nextId = 1;
function createRow(): MedRow {
  return {
    id: nextId++,
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    times: ["08:00"],
    stockCount: "",
    doseAmount: "",
    stockUnit: "錠",
  };
}

export default function BulkMedicationPage() {
  const { user } = useAuth();
  const { activePet } = usePets();
  const router = useRouter();
  const [rows, setRows] = useState<MedRow[]>([createRow()]);
  const [loading, setLoading] = useState(false);

  function updateRow(id: number, patch: Partial<MedRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() { setRows((prev) => [...prev, createRow()]); }
  function removeRow(id: number) { setRows((prev) => prev.filter((r) => r.id !== id)); }

  function addTime(id: number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, times: [...r.times, "08:00"] } : r))
    );
  }
  function updateTime(id: number, i: number, val: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const times = [...r.times];
        times[i] = val;
        return { ...r, times };
      })
    );
  }
  function removeTime(id: number, i: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, times: r.times.filter((_, idx) => idx !== i) } : r
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activePet) return;

    const invalid = rows.find((r) => !r.name.trim() || r.times.length === 0);
    if (invalid) {
      toast.error("薬の名前と投薬時間は必須です");
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        rows.map((r) =>
          api.post("/api/medications", user, {
            petId: activePet.id,
            name: r.name.trim(),
            startDate: r.startDate,
            endDate: r.endDate || undefined,
            times: r.times,
            stockCount: r.stockCount ? parseFloat(r.stockCount) : undefined,
            doseAmount: r.doseAmount ? parseFloat(r.doseAmount) : undefined,
            stockUnit: r.stockUnit || undefined,
          })
        )
      );
      toast.success(`${rows.length}件の薬を登録しました`);
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
    <div className="px-4 pt-6 flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">← 戻る</button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">まとめて投薬登録</h1>
          <p className="text-xs text-text-secondary">{activePet.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {rows.map((row, rowIndex) => {
          const remaining =
            row.stockCount && row.doseAmount && row.times.length > 0
              ? Math.floor(parseFloat(row.stockCount) / (parseFloat(row.doseAmount) * row.times.length))
              : null;

          return (
            <Card key={row.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">薬 {rowIndex + 1}</p>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-xs text-danger"
                  >
                    削除
                  </button>
                )}
              </div>

              <Input
                label="薬の名前"
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
                placeholder="例: フロントライン"
                required
              />

              <div className="flex gap-2">
                <Input
                  label="開始日"
                  type="date"
                  value={row.startDate}
                  onChange={(e) => updateRow(row.id, { startDate: e.target.value })}
                  required
                />
                <Input
                  label="終了日（任意）"
                  type="date"
                  value={row.endDate}
                  onChange={(e) => updateRow(row.id, { endDate: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-text-primary">
                  投薬時間 <span className="text-danger">*</span>
                </p>
                {row.times.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => updateTime(row.id, i, e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {row.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTime(row.id, i)}
                        className="text-danger text-xs px-1"
                      >
                        削除
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTime(row.id)}
                  className="text-xs text-primary text-left mt-1"
                >
                  + 時間を追加
                </button>
              </div>

              <div className="border-t border-border pt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-secondary">残量管理（任意）</p>
                  {remaining !== null && (
                    <span className="text-xs font-semibold text-primary">残り約 {remaining} 日分</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Select
                    label="単位"
                    value={row.stockUnit}
                    onChange={(e) => updateRow(row.id, { stockUnit: e.target.value })}
                  >
                    <option value="錠">錠</option>
                    <option value="ml">ml</option>
                    <option value="">その他</option>
                  </Select>
                  <Input
                    label="総量"
                    type="number"
                    min={0}
                    step={1}
                    value={row.stockCount}
                    onChange={(e) => updateRow(row.id, { stockCount: e.target.value })}
                    placeholder="30"
                  />
                  <Input
                    label="1回量"
                    type="number"
                    min={0}
                    step={0.5}
                    value={row.doseAmount}
                    onChange={(e) => updateRow(row.id, { doseAmount: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>
            </Card>
          );
        })}

        <Button type="button" variant="secondary" onClick={addRow}>
          + 薬を追加
        </Button>

        <Button type="submit" loading={loading} fullWidth>
          {rows.length}件をまとめて登録
        </Button>
      </form>
    </div>
  );
}
