"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";

const CONDITION_OPTIONS = [
  { value: "good", label: "元気" },
  { value: "normal", label: "普通" },
  { value: "poor", label: "悪い" },
];

function ToggleGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <div className="flex rounded-xl border border-border overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2.5 text-sm transition-colors ${
              value === opt.value
                ? "bg-primary text-text-primary font-semibold"
                : "bg-surface text-text-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (value === "") return;
            onChange(value <= 0 ? 0 : value - 1);
          }}
          className="w-10 h-10 rounded-xl border border-border bg-surface text-xl text-text-primary flex items-center justify-center active:scale-95"
        >
          −
        </button>
        <span className="flex-1 text-center text-lg font-semibold text-text-primary">
          {value === "" ? "—" : value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value === "" ? 1 : Math.min(max, value + 1))}
          className="w-10 h-10 rounded-xl border border-border bg-surface text-xl text-text-primary flex items-center justify-center active:scale-95"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

export default function NewHealthRecordPage() {
  const { user } = useAuth();
  const { activePet } = usePets();
  const router = useRouter();

  const [condition, setCondition] = useState("normal");
  const [walked, setWalked] = useState(false);
  const [walkMinutes, setWalkMinutes] = useState("");
  const [weight, setWeight] = useState("");
  const [temperature, setTemperature] = useState("");
  const [mealCount, setMealCount] = useState<number | "">("");
  const [mealAmount, setMealAmount] = useState<number | "">("");
  const [waterCount, setWaterCount] = useState<number | "">("");
  const [urineCount, setUrineCount] = useState<number | "">("");
  const [fecalCount, setFecalCount] = useState<number | "">("");
  const [fecalType, setFecalType] = useState<number | "">("");
  const [vomitCount, setVomitCount] = useState<number | "">(0);
  const [activityLevel, setActivityLevel] = useState<number | "">("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 16));
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todayRecordExists, setTodayRecordExists] = useState(false);

  useEffect(() => {
    if (!user || !activePet) return;
    api.get<{ recordedAt: string }[]>(`/api/health-records?petId=${activePet.id}`, user)
      .then((records) => {
        const today = new Date().toDateString();
        setTodayRecordExists(records.some((r) => new Date(r.recordedAt).toDateString() === today));
      })
      .catch(() => {});
  }, [user, activePet?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activePet) return;
    setLoading(true);
    try {
      await api.post("/api/health-records", user, {
        petId: activePet.id,
        condition,
        walked,
        walkMinutes: walked && walkMinutes ? parseInt(walkMinutes) : undefined,
        recordedAt: new Date(recordedAt).toISOString(),
        weight: weight ? parseFloat(weight) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        mealCount: mealCount !== "" ? mealCount : undefined,
        mealAmount: mealAmount !== "" ? mealAmount : undefined,
        waterCount: waterCount !== "" ? waterCount : undefined,
        urineCount: urineCount !== "" ? urineCount : undefined,
        fecalCount: fecalCount !== "" ? fecalCount : undefined,
        fecalType: fecalType !== "" ? fecalType : undefined,
        vomitCount: vomitCount !== "" ? vomitCount : undefined,
        activityLevel: activityLevel !== "" ? activityLevel : undefined,
      });
      toast.success("記録しました");
      router.push("/health");
    } catch {
      toast.error("記録できませんでした");
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
        <h1 className="text-xl font-bold text-text-primary">健康記録</h1>
      </div>
      <p className="text-sm text-text-secondary -mt-2">{activePet.name}</p>

      {todayRecordExists && (
        <div className="bg-[#FFF9C4] border border-yellow-300 rounded-xl px-4 py-3 text-sm text-yellow-800">
          今日はすでに記録があります。追加で記録することもできます。
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* STEP1: 必須 */}
        <Card>
          <div className="flex flex-col gap-4">
            <ToggleGroup
              label="今日の状態"
              value={condition}
              onChange={setCondition}
              options={CONDITION_OPTIONS}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-primary">散歩</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setWalked(true)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm transition-colors ${walked ? "bg-primary border-primary font-semibold text-text-primary" : "border-border bg-surface text-text-secondary"}`}
                >
                  行った
                </button>
                <button
                  type="button"
                  onClick={() => { setWalked(false); setWalkMinutes(""); }}
                  className={`flex-1 py-2.5 rounded-xl border text-sm transition-colors ${!walked ? "bg-primary border-primary font-semibold text-text-primary" : "border-border bg-surface text-text-secondary"}`}
                >
                  行かなかった
                </button>
              </div>
              {walked && (
                <Input
                  label="散歩時間（分）"
                  type="number"
                  value={walkMinutes}
                  onChange={(e) => setWalkMinutes(e.target.value)}
                  placeholder="例: 30"
                />
              )}
            </div>
            <Input
              label="記録日時"
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
            />
          </div>
        </Card>

        {/* STEP2: 任意 */}
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface text-sm font-medium text-text-primary"
        >
          <span>その他の体調（任意）</span>
          <span>{showOptional ? "▲" : "▼"}</span>
        </button>

        {showOptional && (
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <Input
                  label="体重 (kg)"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="例: 3.5"
                  className="flex-1"
                />
                <Input
                  label="体温 (℃)"
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="例: 38.5"
                  className="flex-1"
                />
              </div>
              <Stepper label="食事回数" value={mealCount} onChange={setMealCount} />
              <Stepper label="飲水回数" value={waterCount} onChange={setWaterCount} />
              <Stepper label="排尿回数" value={urineCount} onChange={setUrineCount} />
              <Stepper label="排便回数" value={fecalCount} onChange={setFecalCount} />
              <Stepper label="嘔吐回数" value={vomitCount} onChange={setVomitCount} />
              <Select
                label="便タイプ"
                value={fecalType === "" ? "" : String(fecalType)}
                onChange={(e) => setFecalType(e.target.value === "" ? "" : parseInt(e.target.value))}
              >
                <option value="">選択しない</option>
                <option value="1">1: 硬い</option>
                <option value="2">2: 普通</option>
                <option value="3">3: やや軟らかい</option>
                <option value="4">4: 軟らかい</option>
                <option value="5">5: 水様</option>
              </Select>
              <Select
                label="活動量"
                value={activityLevel === "" ? "" : String(activityLevel)}
                onChange={(e) => setActivityLevel(e.target.value === "" ? "" : parseInt(e.target.value))}
              >
                <option value="">選択しない</option>
                <option value="1">1: 少ない</option>
                <option value="2">2: 普通</option>
                <option value="3">3: 多い</option>
                <option value="4">4: とても多い</option>
              </Select>
            </div>
          </Card>
        )}

        <Button type="submit" loading={loading} fullWidth>
          記録する
        </Button>
      </form>
    </div>
  );
}
