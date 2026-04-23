"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { PetSelector } from "@/components/features/pets/PetSelector";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";

interface HealthRecord {
  id: string;
  weight: number | null;
  temperature: number | null;
  mealCount: number | null;
  mealAmount: number | null;
  waterCount: number | null;
  fecalCount: number | null;
  fecalType: number | null;
  vomitCount: number | null;
  activityLevel: number | null;
  recordedAt: string;
  isBackfilled: boolean;
}

const ACTIVITY_LABEL = ["", "少ない", "普通", "多い", "とても多い"];
const FECAL_LABEL = ["", "硬い", "普通", "やや軟らかい", "軟らかい", "水様"];

export default function HealthPage() {
  const { user } = useAuth();
  const { activePet, loading: petLoading } = usePets();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loadedPetId, setLoadedPetId] = useState<string | null>(null);

  const loading = Boolean(activePet && loadedPetId !== activePet.id);

  useEffect(() => {
    if (!user || !activePet) return;

    let cancelled = false;

    api
      .get<HealthRecord[]>(`/api/health-records?petId=${activePet.id}`, user)
      .then((data) => {
        if (!cancelled) {
          setRecords(data);
          setLoadedPetId(activePet.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecords([]);
          setLoadedPetId(activePet.id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, activePet?.id]);

  if (petLoading) return <PageSpinner />;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">健康記録</h1>
        {activePet && (
          <Link href="/health/new">
            <Button size="sm">+ 記録</Button>
          </Link>
        )}
      </div>

      <PetSelector />

      {!activePet ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary text-sm">先にペットを登録してください</p>
        </Card>
      ) : loading ? (
        <PageSpinner />
      ) : records.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">❤️</div>
          <p className="text-text-secondary text-sm">健康記録がまだありません</p>
          <Link href="/health/new" className="block mt-4">
            <Button>最初の記録を入力する</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {records.map((r) => (
            <Link key={r.id} href={`/health/${r.id}`}>
            <Card>
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-text-primary">
                  {formatDateTime(r.recordedAt)}
                  {r.isBackfilled && (
                    <span className="text-xs text-text-secondary ml-2">（後入力）</span>
                  )}
                </p>
                <span className="text-xs text-primary font-medium">詳細 ›</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {r.weight != null && (
                  <p className="text-sm text-text-secondary">体重: <span className="text-text-primary font-medium">{r.weight} kg</span></p>
                )}
                {r.temperature != null && (
                  <p className="text-sm text-text-secondary">体温: <span className="text-text-primary font-medium">{r.temperature} ℃</span></p>
                )}
                {r.mealCount != null && (
                  <p className="text-sm text-text-secondary">食事: <span className="text-text-primary font-medium">{r.mealCount} 回</span></p>
                )}
                {r.waterCount != null && (
                  <p className="text-sm text-text-secondary">飲水: <span className="text-text-primary font-medium">{r.waterCount} 回</span></p>
                )}
                {r.fecalCount != null && (
                  <p className="text-sm text-text-secondary">排便: <span className="text-text-primary font-medium">{r.fecalCount} 回</span></p>
                )}
                {r.fecalType != null && (
                  <p className="text-sm text-text-secondary">便タイプ: <span className="text-text-primary font-medium">{FECAL_LABEL[r.fecalType]}</span></p>
                )}
                {r.vomitCount != null && r.vomitCount > 0 && (
                  <p className="text-sm text-danger">嘔吐: <span className="font-medium">{r.vomitCount} 回</span></p>
                )}
                {r.activityLevel != null && (
                  <p className="text-sm text-text-secondary">活動量: <span className="text-text-primary font-medium">{ACTIVITY_LABEL[r.activityLevel]}</span></p>
                )}
              </div>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
