"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Hospital {
  id: string;
  name: string;
}

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
  hospitalId: string | null;
  hospitalName: string;
  diagnosis: string | null;
  note: string | null;
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
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editVisitDate, setEditVisitDate] = useState("");
  const [editHospitalId, setEditHospitalId] = useState("");
  const [editHospitalName, setEditHospitalName] = useState("");
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editNextVisitDate, setEditNextVisitDate] = useState("");

  useEffect(() => {
    if (!user || !params.id) return;
    Promise.all([
      api.get<Visit>(`/api/visits/${params.id}`, user),
      api.get<Hospital[]>("/api/hospitals", user).catch(() => [] as Hospital[]),
    ])
      .then(([v, h]) => {
        setVisit(v);
        setHospitals(h);
      })
      .catch(() => toast.error("読み込めませんでした"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  function startEdit() {
    if (!visit) return;
    setEditVisitDate(visit.visitDate.split("T")[0]);
    setEditHospitalId(visit.hospitalId ?? "");
    setEditHospitalName(visit.hospitalName);
    setEditDiagnosis(visit.diagnosis ?? "");
    setEditNote(visit.note ?? "");
    setEditNextVisitDate(visit.nextVisitDate ? visit.nextVisitDate.split("T")[0] : "");
    setEditing(true);
  }

  function handleHospitalSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setEditHospitalId(id);
    if (id) {
      const h = hospitals.find((h) => h.id === id);
      setEditHospitalName(h?.name ?? "");
    }
  }

  async function handleSave() {
    if (!user || !visit) return;
    if (!editHospitalName.trim()) {
      toast.error("病院名を入力してください");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch<Visit>(`/api/visits/${visit.id}`, user, {
        visitDate: editVisitDate,
        hospitalId: editHospitalId || null,
        hospitalName: editHospitalName,
        diagnosis: editDiagnosis || null,
        note: editNote || null,
        nextVisitDate: editNextVisitDate || null,
      });
      setVisit(updated);
      setEditing(false);
      toast.success("更新しました");
    } catch {
      toast.error("更新できませんでした");
    } finally {
      setSaving(false);
    }
  }

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

  if (editing) {
    return (
      <div className="px-4 pt-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(false)} className="text-text-secondary">
            ← キャンセル
          </button>
          <h1 className="text-xl font-bold text-text-primary">通院記録を編集</h1>
        </div>

        <Card>
          <div className="flex flex-col gap-4">
            <Input
              label="通院日"
              type="date"
              value={editVisitDate}
              onChange={(e) => setEditVisitDate(e.target.value)}
              required
            />

            {hospitals.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">病院を選択</label>
                <select
                  value={editHospitalId}
                  onChange={handleHospitalSelect}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">直接入力する</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="病院名"
              value={editHospitalName}
              onChange={(e) => { setEditHospitalName(e.target.value); setEditHospitalId(""); }}
              placeholder="例: ○○動物病院"
              required
            />
            <TextArea
              label="診断内容（任意）"
              value={editDiagnosis}
              onChange={(e) => setEditDiagnosis(e.target.value)}
            />
            <TextArea
              label="メモ（任意）"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
            />
            <Input
              label="次回通院予定日（任意）"
              type="date"
              value={editNextVisitDate}
              onChange={(e) => setEditNextVisitDate(e.target.value)}
            />
            <Button loading={saving} onClick={handleSave} fullWidth>
              保存する
            </Button>
          </div>
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
        <h1 className="text-xl font-bold text-text-primary flex-1 truncate">{visit.hospitalName}</h1>
        <button onClick={startEdit} className="text-sm text-primary font-medium">
          編集
        </button>
      </div>

      <Card className="flex flex-col gap-3">
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
        {visit.note && (
          <div>
            <p className="text-xs text-text-secondary">メモ</p>
            <p className="text-sm font-medium text-text-primary">{visit.note}</p>
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
