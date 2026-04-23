"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface HealthRecord {
  id: string;
  condition: string;
  walked: boolean;
  walkMinutes: number | null;
  weight: number | null;
  temperature: number | null;
  mealCount: number | null;
  mealAmount: number | null;
  waterCount: number | null;
  urineCount: number | null;
  fecalCount: number | null;
  fecalType: number | null;
  vomitCount: number | null;
  activityLevel: number | null;
  recordedAt: string;
  isBackfilled: boolean;
}

const CONDITION_LABEL: Record<string, string> = { good: "元気", normal: "普通", poor: "悪い" };
const CONDITION_COLOR: Record<string, string> = {
  good: "text-[#16A34A]",
  normal: "text-text-primary",
  poor: "text-danger",
};
const ACTIVITY_LABEL = ["", "少ない", "普通", "多い", "とても多い"];
const FECAL_LABEL = ["", "硬い", "普通", "やや軟らかい", "軟らかい", "水様"];

export default function HealthDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;
    api.get<HealthRecord>(`/api/health-records/${params.id}`, user)
      .then(setRecord)
      .catch(() => toast.error("読み込めませんでした"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  async function handleDelete() {
    if (!user || !record) return;
    if (!confirm("この健康記録を削除しますか？")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/health-records/${record.id}`, user);
      toast.success("削除しました");
      router.push("/health");
    } catch {
      toast.error("削除できませんでした");
      setDeleting(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (!record) return null;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary">健康記録詳細</h1>
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary">記録日時</p>
            <p className="text-sm font-medium text-text-primary">
              {formatDateTime(record.recordedAt)}
              {record.isBackfilled && (
                <span className="text-xs text-text-secondary ml-2">（後入力）</span>
              )}
            </p>
          </div>
          <p className={`text-lg font-bold ${CONDITION_COLOR[record.condition] ?? ""}`}>
            {CONDITION_LABEL[record.condition] ?? record.condition}
          </p>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-xs text-text-secondary mb-2">基本情報</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-xs text-text-secondary">散歩</p>
              <p className="text-sm font-medium text-text-primary">
                {record.walked ? "あり" : "なし"}
                {record.walked && record.walkMinutes != null && ` (${record.walkMinutes}分)`}
              </p>
            </div>
            {record.weight != null && (
              <div>
                <p className="text-xs text-text-secondary">体重</p>
                <p className="text-sm font-medium text-text-primary">{record.weight} kg</p>
              </div>
            )}
            {record.temperature != null && (
              <div>
                <p className="text-xs text-text-secondary">体温</p>
                <p className="text-sm font-medium text-text-primary">{record.temperature} ℃</p>
              </div>
            )}
          </div>
        </div>

        {(record.mealCount != null || record.mealAmount != null || record.waterCount != null) && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-text-secondary mb-2">食事・水分</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {record.mealCount != null && (
                <div>
                  <p className="text-xs text-text-secondary">食事回数</p>
                  <p className="text-sm font-medium text-text-primary">{record.mealCount} 回</p>
                </div>
              )}
              {record.mealAmount != null && (
                <div>
                  <p className="text-xs text-text-secondary">食事量</p>
                  <p className="text-sm font-medium text-text-primary">{record.mealAmount} %</p>
                </div>
              )}
              {record.waterCount != null && (
                <div>
                  <p className="text-xs text-text-secondary">飲水回数</p>
                  <p className="text-sm font-medium text-text-primary">{record.waterCount} 回</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(record.urineCount != null || record.fecalCount != null || record.fecalType != null || record.vomitCount != null) && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-text-secondary mb-2">排泄・嘔吐</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {record.urineCount != null && (
                <div>
                  <p className="text-xs text-text-secondary">排尿</p>
                  <p className="text-sm font-medium text-text-primary">{record.urineCount} 回</p>
                </div>
              )}
              {record.fecalCount != null && (
                <div>
                  <p className="text-xs text-text-secondary">排便</p>
                  <p className="text-sm font-medium text-text-primary">{record.fecalCount} 回</p>
                </div>
              )}
              {record.fecalType != null && (
                <div>
                  <p className="text-xs text-text-secondary">便タイプ</p>
                  <p className="text-sm font-medium text-text-primary">{FECAL_LABEL[record.fecalType]}</p>
                </div>
              )}
              {record.vomitCount != null && (
                <div>
                  <p className="text-xs text-text-secondary">嘔吐</p>
                  <p className={`text-sm font-medium ${record.vomitCount > 0 ? "text-danger" : "text-text-primary"}`}>
                    {record.vomitCount} 回
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {record.activityLevel != null && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-text-secondary">活動量</p>
            <p className="text-sm font-medium text-text-primary">{ACTIVITY_LABEL[record.activityLevel]}</p>
          </div>
        )}
      </Card>

      <Button variant="danger" loading={deleting} onClick={handleDelete} fullWidth>
        この記録を削除する
      </Button>
    </div>
  );
}
