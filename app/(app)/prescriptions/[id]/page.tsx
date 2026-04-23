"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  visit: { hospitalName: string; visitDate: string; diagnosis: string | null } | null;
}

export default function PrescriptionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;
    api.get<Prescription>(`/api/prescriptions/${params.id}`, user)
      .then(setPrescription)
      .catch(() => toast.error("読み込めませんでした"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  async function handleDelete() {
    if (!user || !prescription) return;
    if (!confirm("この処方記録を削除しますか？")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/prescriptions/${prescription.id}`, user);
      toast.success("削除しました");
      router.push("/prescriptions");
    } catch {
      toast.error("削除できませんでした");
      setDeleting(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (!prescription) return null;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary">処方詳細</h1>
      </div>

      <Card className="flex flex-col gap-2">
        <div>
          <p className="text-xs text-text-secondary">処方日</p>
          <p className="text-sm font-medium text-text-primary">{formatDate(prescription.prescribedDate)}</p>
        </div>
        {prescription.visit && (
          <>
            <div>
              <p className="text-xs text-text-secondary">病院</p>
              <p className="text-sm font-medium text-text-primary">{prescription.visit.hospitalName}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">通院日</p>
              <p className="text-sm font-medium text-text-primary">{formatDate(prescription.visit.visitDate)}</p>
            </div>
            {prescription.visit.diagnosis && (
              <div>
                <p className="text-xs text-text-secondary">診断内容</p>
                <p className="text-sm font-medium text-text-primary">{prescription.visit.diagnosis}</p>
              </div>
            )}
          </>
        )}
      </Card>

      <div>
        <h2 className="text-base font-semibold text-text-primary mb-2">処方薬</h2>
        <div className="flex flex-col gap-2">
          {prescription.medications.map((m) => (
            <Card key={m.id} className="flex items-start gap-3">
              <div className="text-2xl">💊</div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary">{m.name}</p>
                <p className="text-sm text-text-secondary">
                  用量: {m.dosage}
                </p>
                <p className="text-sm text-text-secondary">
                  1日{m.frequency}回 × {m.duration}日間
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Button variant="danger" loading={deleting} onClick={handleDelete} fullWidth>
        この処方記録を削除する
      </Button>
    </div>
  );
}
