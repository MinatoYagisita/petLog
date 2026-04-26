"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import toast from "react-hot-toast";
import Link from "next/link";

interface Listing {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
}

type Tab = "search" | "manual";

export default function NewSalonPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("search");

  // Directory search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/place-listings?type=salon&q=${encodeURIComponent(query)}`).catch(() => null);
      setResults(res?.ok ? await res.json() : []);
      setSearching(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function selectListing(l: Listing) {
    setName(l.name);
    setPhone(l.phone ?? "");
    setTab("manual");
    setResults([]);
    setQuery("");
  }

  const mapsUrl = name
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " ペットサロン")}`
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await api.post("/api/salons", user, {
        name,
        phone: phone || undefined,
        note: note || undefined,
      });
      toast.success(`${name} を登録しました`);
      router.push("/salons");
    } catch {
      toast.error("登録できませんでした");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-6 flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">← 戻る</button>
        <h1 className="text-xl font-bold text-text-primary">サロン登録</h1>
      </div>

      <div className="flex rounded-xl bg-app-bg border border-border p-1">
        <button
          onClick={() => setTab("search")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "search" ? "bg-surface shadow-sm text-text-primary" : "text-text-secondary"
          }`}
        >
          認定施設から選ぶ
        </button>
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "manual" ? "bg-surface shadow-sm text-text-primary" : "text-text-secondary"
          }`}
        >
          手動で入力
        </button>
      </div>

      {tab === "search" && (
        <div className="flex flex-col gap-3">
          <Input
            label=""
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="サロン名で検索..."
          />
          {searching && <p className="text-sm text-text-secondary text-center">検索中...</p>}
          {!searching && query && results.length === 0 && (
            <Card>
              <p className="text-sm text-text-secondary text-center py-3">
                認定施設が見つかりません。「手動で入力」から登録できます。
              </p>
            </Card>
          )}
          {results.map((l) => (
            <button key={l.id} onClick={() => selectListing(l)} className="text-left w-full">
              <Card className="flex items-center gap-3 active:opacity-70 transition-opacity">
                {l.photoUrl ? (
                  <img src={l.photoUrl} alt={l.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-app-bg flex items-center justify-center text-2xl flex-shrink-0">✂️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{l.name}</p>
                  {l.phone && <p className="text-sm text-text-secondary">{l.phone}</p>}
                  {l.address && <p className="text-xs text-text-secondary truncate">{l.address}</p>}
                </div>
                <Link
                  href={`/place-listings/${l.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-primary underline flex-shrink-0"
                >
                  詳細
                </Link>
              </Card>
            </button>
          ))}
          {!query && (
            <p className="text-sm text-text-secondary text-center mt-4">
              サロン名を入力して検索してください
            </p>
          )}
        </div>
      )}

      {tab === "manual" && (
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Input
                label="サロン名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: ○○ペットサロン"
                required
              />
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline self-end"
                >
                  Googleマップで確認する →
                </a>
              )}
            </div>
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
              placeholder="例: 毎月第2土曜"
            />
            <Button type="submit" loading={loading} fullWidth>登録する</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
