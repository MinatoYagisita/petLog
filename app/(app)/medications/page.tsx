"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { PetSelector } from "@/components/features/pets/PetSelector";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";

interface MedicationSchedule {
  id: string;
  time: string;
}

interface Medication {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  schedules: MedicationSchedule[];
}

export default function MedicationsPage() {
  const { user } = useAuth();
  const { activePet, loading: petLoading } = usePets();
  const [medications, setMedications] = useState<Medication[]>([]);
  // loadedPetId: 最後にフェッチ完了した petId を記憶
  const [loadedPetId, setLoadedPetId] = useState<string | null>(null);

  // effect内で同期 setState しないよう、loading を派生値として計算
  const loading = Boolean(activePet && loadedPetId !== activePet.id);

  useEffect(() => {
    if (!user || !activePet) return;

    let cancelled = false;

    api
      .get<Medication[]>(`/api/medications?petId=${activePet.id}`, user)
      .then((data) => {
        if (!cancelled) {
          setMedications(data);
          setLoadedPetId(activePet.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMedications([]);
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
        <h1 className="text-xl font-bold text-text-primary">投薬管理</h1>
        {activePet && (
          <Link href="/medications/new">
            <Button size="sm">+ 追加</Button>
          </Link>
        )}
      </div>

      <PetSelector />

      {!activePet ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary text-sm">
            まずペットを登録してください
          </p>
          <Link href="/pets/new" className="block mt-4">
            <Button>ペットを登録する</Button>
          </Link>
        </Card>
      ) : loading ? (
        <PageSpinner />
      ) : medications.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">💊</div>
          <p className="text-text-secondary text-sm">
            {activePet.name} の投薬がまだ登録されていません
          </p>
          <Link href="/medications/new" className="block mt-4">
            <Button>投薬を登録する</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {medications.map((med) => {
            const isActive = !med.endDate || new Date(med.endDate) >= new Date();
            return (
              <Link key={med.id} href={`/medications/${med.id}`}>
                <Card className="flex items-start gap-3 cursor-pointer hover:border-primary transition-colors">
                  <div className="text-2xl">💊</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary truncate">{med.name}</p>
                      <Badge className={isActive ? "text-success bg-green-50" : "text-text-secondary bg-app-bg"}>
                        {isActive ? "服用中" : "終了"}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {med.schedules.map((s) => s.time).join(" / ")} ×{" "}
                      {med.schedules.length}回/日
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(med.startDate)} 〜{" "}
                      {med.endDate ? formatDate(med.endDate) : "継続"}
                    </p>
                  </div>
                  <span className="text-text-secondary text-sm">›</span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
