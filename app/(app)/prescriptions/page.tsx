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
import toast from "react-hot-toast";

interface PrescriptionMed {
  id: string;
  name: string;
  dosage: string;
  frequency: number;
  duration: number;
}

interface Prescription {
  id: string;
  prescribedDate: string;
  medications: PrescriptionMed[];
  visit: { hospitalName: string; visitDate: string } | null;
}

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const { activePet } = usePets();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activePet) return;
    setLoading(true);
    api.get<Prescription[]>(`/api/prescriptions?petId=${activePet.id}`, user)
      .then(setPrescriptions)
      .catch(() => toast.error("読み込めませんでした"))
      .finally(() => setLoading(false));
  }, [user, activePet?.id]);

  if (loading) return <PageSpinner />;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">お薬手帳</h1>

      <PetSelector />

      {!activePet ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary text-sm">先にペットを登録してください</p>
        </Card>
      ) : prescriptions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary text-sm">処方記録がありません</p>
          <p className="text-xs text-text-secondary mt-2">通院登録時に処方情報を入力すると記録されます</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {prescriptions.map((p) => (
            <Link key={p.id} href={`/prescriptions/${p.id}`}>
              <Card className="flex flex-col gap-2 cursor-pointer hover:border-primary transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary">
                    処方日: {formatDate(p.prescribedDate)}
                  </p>
                  <span className="text-xs text-text-secondary">
                    {p.medications.length}種類
                  </span>
                </div>
                {p.visit && (
                  <p className="text-xs text-text-secondary">
                    {p.visit.hospitalName} ({formatDate(p.visit.visitDate)})
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.medications.map((m) => (
                    <span
                      key={m.id}
                      className="text-xs bg-app-bg text-text-primary px-2 py-0.5 rounded-full border border-border"
                    >
                      💊 {m.name}
                    </span>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
