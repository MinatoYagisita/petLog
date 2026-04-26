"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDate, formatDateTime, MED_STATUS_LABEL, MED_STATUS_COLOR } from "@/lib/utils";
import toast from "react-hot-toast";

interface MedicationLog {
  id: string;
  date: string;
  status: string;
  actualTime: string | null;
  note: string | null;
}

interface MedicationSchedule {
  id: string;
  time: string;
  logs: MedicationLog[];
}

interface Medication {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  stockCount: number | null;
  doseAmount: number | null;
  stockUnit: string | null;
  note: string | null;
  schedules: MedicationSchedule[];
}

export default function MedicationDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showRefill, setShowRefill] = useState(false);
  const [refillAmount, setRefillAmount] = useState("");
  const [refilling, setRefilling] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;
    api
      .get<Medication>(`/api/medications/${params.id}`, user)
      .then(setMedication)
      .catch(() => toast.error("読み込めませんでした"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  async function handleDelete() {
    if (!user || !medication) return;
    if (!confirm(`${medication.name} を削除しますか？`)) return;
    setDeleting(true);
    try {
      await api.delete(`/api/medications/${medication.id}`, user);
      toast.success("削除しました");
      router.push("/medications");
    } catch {
      toast.error("削除できませんでした");
      setDeleting(false);
    }
  }

  async function handleRefill() {
    if (!user || !medication || !refillAmount) return;
    setRefilling(true);
    try {
      const addAmount = parseFloat(refillAmount);
      const newStock = (medication.stockCount ?? 0) + addAmount;
      await api.patch(`/api/medications/${medication.id}`, user, { stockCount: newStock });
      setMedication({ ...medication, stockCount: newStock });
      setRefillAmount("");
      setShowRefill(false);
      toast.success(`${addAmount}${medication.stockUnit ?? ""} 補充しました（残量: ${newStock}${medication.stockUnit ?? ""}）`);
    } catch {
      toast.error("補充できませんでした");
    } finally {
      setRefilling(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (!medication) return null;

  const allLogs = medication.schedules.flatMap((s) =>
    s.logs.map((l) => ({ ...l, scheduledTime: s.time }))
  );
  allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const perDay = medication.doseAmount && medication.schedules.length > 0
    ? medication.doseAmount * medication.schedules.length
    : null;
  const remainingDays = medication.stockCount != null && perDay
    ? Math.floor(medication.stockCount / perDay)
    : null;
  const isLow = remainingDays != null && remainingDays <= 7;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary flex-1 truncate">{medication.name}</h1>
      </div>

      <Card>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-text-secondary">
            {formatDate(medication.startDate)} 〜{" "}
            {medication.endDate ? formatDate(medication.endDate) : "継続"}
          </p>
          <p className="text-sm text-text-secondary">
            投薬時間: {medication.schedules.map((s) => s.time).join(" / ")}
          </p>
          {medication.note && (
            <p className="text-sm text-text-secondary mt-1">{medication.note}</p>
          )}
        </div>
      </Card>

      {/* 残量管理 */}
      {medication.stockCount != null && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-primary">残量</h2>
            <button
              onClick={() => setShowRefill((v) => !v)}
              className="text-xs text-primary font-medium"
            >
              {showRefill ? "キャンセル" : "補充する"}
            </button>
          </div>
          <div className={`flex items-baseline gap-1 ${isLow ? "text-danger" : "text-text-primary"}`}>
            <span className="text-2xl font-bold">{medication.stockCount}</span>
            <span className="text-sm">{medication.stockUnit ?? ""}</span>
            {remainingDays != null && (
              <span className={`text-sm ml-2 ${isLow ? "text-danger font-semibold" : "text-text-secondary"}`}>
                （残り約 {remainingDays} 日分{isLow ? " ⚠️" : ""}）
              </span>
            )}
          </div>
          {perDay && (
            <p className="text-xs text-text-secondary mt-1">
              1日あたり {perDay}{medication.stockUnit ?? ""} 使用
            </p>
          )}
          {showRefill && (
            <div className="mt-3 flex gap-2 items-end">
              <Input
                label={`補充量（${medication.stockUnit ?? ""}）`}
                type="number"
                value={refillAmount}
                onChange={(e) => setRefillAmount(e.target.value)}
                placeholder="例: 30"
                className="flex-1"
              />
              <Button
                size="sm"
                loading={refilling}
                onClick={handleRefill}
                className="flex-shrink-0 mb-0.5"
              >
                追加
              </Button>
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="text-base font-semibold text-text-primary mb-2">投薬履歴</h2>
        {allLogs.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-secondary text-sm">履歴がありません</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {allLogs.slice(0, 30).map((log) => (
              <Card key={log.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{formatDate(log.date)} {log.scheduledTime}</p>
                  {log.actualTime && (
                    <p className="text-xs text-text-secondary">
                      実施: {formatDateTime(log.actualTime)}
                    </p>
                  )}
                  {log.note && <p className="text-xs text-text-secondary mt-0.5">{log.note}</p>}
                </div>
                <Badge className={MED_STATUS_COLOR[log.status] ?? ""}>
                  {MED_STATUS_LABEL[log.status] ?? log.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Button variant="danger" loading={deleting} onClick={handleDelete} fullWidth>
        この投薬を削除する
      </Button>
    </div>
  );
}
