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
import { formatDate } from "@/lib/utils";

interface Prescription {
  id: string;
  medications: { id: string; name: string; dosage: string; frequency: number; duration: number }[];
}

interface Visit {
  id: string;
  visitDate: string;
  hospitalName: string;
  diagnosis: string | null;
  nextVisitDate: string | null;
  prescription: Prescription | null;
}

export default function VisitsPage() {
  const { user } = useAuth();
  const { activePet, loading: petLoading } = usePets();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadedPetId, setLoadedPetId] = useState<string | null>(null);

  const loading = Boolean(activePet && loadedPetId !== activePet.id);

  useEffect(() => {
    if (!user || !activePet) return;

    let cancelled = false;

    api
      .get<Visit[]>(`/api/visits?petId=${activePet.id}`, user)
      .then((data) => {
        if (!cancelled) {
          setVisits(data);
          setLoadedPetId(activePet.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVisits([]);
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
        <h1 className="text-xl font-bold text-text-primary">通院記録</h1>
        {activePet && (
          <Link href="/visits/new">
            <Button size="sm">+ 登録</Button>
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
      ) : visits.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">🏥</div>
          <p className="text-text-secondary text-sm">通院記録がまだありません</p>
          <Link href="/visits/new" className="block mt-4">
            <Button>通院を記録する</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visits.map((v) => (
            <Link key={v.id} href={`/visits/${v.id}`}>
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🏥</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">{v.hospitalName}</p>
                    <p className="text-sm text-text-secondary">{formatDate(v.visitDate)}</p>
                    {v.diagnosis && (
                      <p className="text-xs text-text-secondary mt-1 truncate">{v.diagnosis}</p>
                    )}
                    {v.prescription && (
                      <p className="text-xs text-primary mt-1">
                        処方あり ({v.prescription.medications.length}種)
                      </p>
                    )}
                    {v.nextVisitDate && (
                      <p className="text-xs text-text-secondary mt-1">
                        次回: {formatDate(v.nextVisitDate)}
                      </p>
                    )}
                  </div>
                  <span className="text-text-secondary text-sm">›</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
