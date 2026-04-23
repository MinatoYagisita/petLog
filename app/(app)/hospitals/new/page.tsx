"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { PlaceSearch } from "@/components/features/places/PlaceSearch";
import toast from "react-hot-toast";

export default function NewHospitalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await api.post("/api/hospitals", user, {
        name,
        phone: phone || undefined,
        note: note || undefined,
      });
      toast.success(`${name} を登録しました`);
      router.push("/hospitals");
    } catch {
      toast.error("登録できませんでした");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">← 戻る</button>
        <h1 className="text-xl font-bold text-text-primary">病院登録</h1>
      </div>

      <Card className="flex flex-col gap-4">
        <PlaceSearch
          type="hospital"
          onSelect={(p) => { setName(p.name); if (p.phone) setPhone(p.phone); }}
        />
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="病院名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ○○動物病院"
            required
          />
          <Input
            label="電話番号（任意）"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="例: 03-1234-5678"
          />
          <TextArea
            label="メモ（任意）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例: 午前診察のみ"
          />
          <Button type="submit" loading={loading} fullWidth>登録する</Button>
        </form>
      </Card>
    </div>
  );
}
