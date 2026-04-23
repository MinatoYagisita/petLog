"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

interface Hospital {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
}

export default function EditHospitalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;
    api.get<Hospital[]>("/api/hospitals", user).then((list) => {
      const h = list.find((x) => x.id === params.id);
      if (h) {
        setName(h.name);
        setPhone(h.phone ?? "");
        setNote(h.note ?? "");
      }
    }).finally(() => setLoading(false));
  }, [user, params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await api.patch(`/api/hospitals/${params.id}`, user, {
        name,
        phone: phone || null,
        note: note || null,
      });
      toast.success("更新しました");
      router.push("/hospitals");
    } catch {
      toast.error("更新できませんでした");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary">病院編集</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="病院名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="電話番号（任意）"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextArea
            label="メモ（任意）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button type="submit" loading={saving} fullWidth>
            保存する
          </Button>
        </form>
      </Card>
    </div>
  );
}
