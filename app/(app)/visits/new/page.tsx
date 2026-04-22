"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/Input";
import toast from "react-hot-toast";

interface PrescriptionMedInput {
  name: string;
  dosage: string;
  frequency: number;
  duration: number;
}

export default function NewVisitPage() {
  const { user } = useAuth();
  const { activePet } = usePets();
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];
  const [visitDate, setVisitDate] = useState(today);
  const [hospitalName, setHospitalName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [hasPrescription, setHasPrescription] = useState(false);
  const [prescribedDate, setPrescribedDate] = useState(today);
  const [meds, setMeds] = useState<PrescriptionMedInput[]>([
    { name: "", dosage: "", frequency: 1, duration: 7 },
  ]);
  const [loading, setLoading] = useState(false);

  function addMed() {
    setMeds([...meds, { name: "", dosage: "", frequency: 1, duration: 7 }]);
  }

  function removeMed(i: number) {
    setMeds(meds.filter((_, idx) => idx !== i));
  }

  function updateMed(i: number, field: keyof PrescriptionMedInput, val: string | number) {
    const next = [...meds];
    next[i] = { ...next[i], [field]: val };
    setMeds(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activePet) return;
    setLoading(true);
    try {
      await api.post("/api/visits", user, {
        petId: activePet.id,
        visitDate,
        hospitalName,
        diagnosis: diagnosis || undefined,
        nextVisitDate: nextVisitDate || undefined,
        prescription: hasPrescription && meds.some((m) => m.name)
          ? { prescribedDate, medications: meds.filter((m) => m.name) }
          : undefined,
      });
      toast.success("通院を記録しました");
      router.push("/visits");
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
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary">通院登録</h1>
      </div>
      <p className="text-sm text-text-secondary -mt-2">{activePet.name}</p>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="通院日"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
          />
          <Input
            label="病院名"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="例: ○○動物病院"
            required
          />
          <TextArea
            label="診断内容（任意）"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="例: 膀胱炎"
          />
          <Input
            label="次回通院予定日（任意）"
            type="date"
            value={nextVisitDate}
            onChange={(e) => setNextVisitDate(e.target.value)}
          />

          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPrescription}
                onChange={(e) => setHasPrescription(e.target.checked)}
                className="w-5 h-5 rounded accent-primary"
              />
              <span className="text-sm font-medium text-text-primary">処方あり</span>
            </label>
          </div>

          {hasPrescription && (
            <div className="flex flex-col gap-4 bg-app-bg rounded-xl p-4">
              <Input
                label="処方日"
                type="date"
                value={prescribedDate}
                onChange={(e) => setPrescribedDate(e.target.value)}
              />
              {meds.map((med, i) => (
                <div key={i} className="bg-surface rounded-xl border border-border p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">薬 {i + 1}</p>
                    {meds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMed(i)}
                        className="text-xs text-danger"
                      >
                        削除
                      </button>
                    )}
                  </div>
                  <Input
                    label="薬名"
                    value={med.name}
                    onChange={(e) => updateMed(i, "name", e.target.value)}
                    placeholder="例: アモキシシリン"
                  />
                  <Input
                    label="用量"
                    value={med.dosage}
                    onChange={(e) => updateMed(i, "dosage", e.target.value)}
                    placeholder="例: 50mg"
                  />
                  <div className="flex gap-3">
                    <Input
                      label="1日回数"
                      type="number"
                      min={1}
                      value={med.frequency}
                      onChange={(e) => updateMed(i, "frequency", parseInt(e.target.value))}
                    />
                    <Input
                      label="日数"
                      type="number"
                      min={1}
                      value={med.duration}
                      onChange={(e) => updateMed(i, "duration", parseInt(e.target.value))}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={addMed}>
                + 薬を追加
              </Button>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth>
            記録する
          </Button>
        </form>
      </Card>
    </div>
  );
}
