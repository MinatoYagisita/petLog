"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

function compressToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 400;
      let { width, height } = img;
      if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
      else if (height > width && height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
      else if (width > maxSize) { height = maxSize; width = maxSize; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function PlaceApplyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    user.getIdToken().then(async (token) => {
      const res = await fetch("/api/place-accounts/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { router.replace("/login"); return; }
      setAuthorized(true);
      setChecking(false);
    }).catch(() => router.replace("/login"));
  }, [user, loading, router]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        try { photoUrl = await compressToBase64(photoFile); } catch { /* skip */ }
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/place-listings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          photoUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "申請に失敗しました");
        return;
      }

      toast.success("申請を送信しました。審査をお待ちください");
      router.replace("/place-dashboard");
    } catch {
      toast.error("申請に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || checking) return <PageSpinner />;
  if (!authorized) return null;

  const mapsSearchUrl = name.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name.trim())}`
    : null;

  return (
    <div className="min-h-screen bg-app-bg px-4 pt-6 pb-12 max-w-[480px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary">← 戻る</button>
        <h1 className="text-xl font-bold text-text-primary">掲載申請</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Photo */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-surface flex items-center justify-center"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">🏥</span>
                <span className="text-[10px] text-text-secondary">写真を追加</span>
              </div>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <Card>
          <div className="flex flex-col gap-4">
            <Input
              label="施設名 *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="〇〇動物病院"
              required
            />
            {mapsSearchUrl && (
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline -mt-2"
              >
                Googleマップで確認する →
              </a>
            )}
            <Input
              label="電話番号"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03-1234-5678"
            />
            <Input
              label="住所"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="東京都渋谷区..."
            />
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-text-primary mb-3">Googleマップ座標（任意）</p>
          <p className="text-xs text-text-secondary mb-3">
            Googleマップで施設を開き、URLから緯度・経度をコピーしてください。
          </p>
          <div className="flex gap-3">
            <Input
              label="緯度 (lat)"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="35.681236"
              className="flex-1"
            />
            <Input
              label="経度 (lng)"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="139.767125"
              className="flex-1"
            />
          </div>
        </Card>

        <Button type="submit" loading={submitting} fullWidth>
          申請する
        </Button>
      </form>
    </div>
  );
}
