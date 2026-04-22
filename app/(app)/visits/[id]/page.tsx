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

interface Visit {
  id: string;
  visitDate: string;
  hospitalName: string;
  diagnosis: string | null;
  nextVisitDate: string | null;
  prescription: {
    id: string;
    prescribedDate: string;
    medications: PrescriptionMed[];
  } | null;
}

export default function VisitDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;
    api
      .get<Visit>(`/api/visits/${params.id}`, user)
      .then(setVisit)
      .catch(() => toast.error("読み込めませんでした"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  async function handleDelete() {
    if (!user || !visit) return;
    if (!confirm("この通院記録を削除しますか？")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/visits/${visit.id}`, user);
      toast.success("削除しました");
      router.push("/visits");
    } catch {
      toast.error("削除できませんでした");
      setDeleting(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (!visit) return null;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary">{visit.hospitalName}</h1>
      </div>

      <Card className="flex flex-col gap-2">
        <div>
          <p className="text-xs text-text-secondary">通院日</p>
          <p className="text-sm font-medium text-text-primary">{formatDate(visit.visitDate)}</p>
        </div>
        {visit.diagnosis && (
          <div>
            <p className="text-xs text-text-secondary">診断内容</p>
            <p className="text-sm font-medium text-text-primary">{visit.diagnosis}</p>
          </div>
        )}
        {visit.nextVisitDate && (
          <div>
            <p className="text-xs text-text-secondary">次回通院予定</p>
            <p className="text-sm font-medium text-text-primary">{formatDate(visit.nextVisitDate)}</p>
          </div>
        )}
      </Card>

      {visit.prescription && (
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-2">処方内容</h2>
          <p className="text-xs text-text-secondary mb-2">
            処方日: {formatDate(visit.prescription.prescribedDate)}
          </p>
          <div className="flex flex-col gap-2">
            {visit.prescription.medications.map((m) => (
              <Card key={m.id} className="flex items-start gap-3">
                <div className="text-2xl">💊</div>
                <div>
                  <p className="font-semibold text-text-primary">{m.name}</p>
                  <p className="text-sm text-text-secondary">
                    {m.dosage} / 1日{m.frequency}回 / {m.duration}日間
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Button variant="danger" loading={deleting} onClick={handleDelete} fullWidth>
        この通院記録を削除する
      </Button>
    </div>
  );
}
