"use client";

import { useState } from "react";

export interface PlaceResult {
  name: string;
  phone?: string;
}

interface SearchResult {
  name: string;
  address: string;
  phone: string;
}

interface Props {
  type: "hospital" | "salon";
  onSelect: (result: PlaceResult) => void;
}

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export function PlaceSearch({ type, onSelect }: Props) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [fetching, setFetching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handlePrefectureChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const pref = e.target.value;
    if (!pref) {
      setResults([]);
      setSearched(false);
      return;
    }

    setFetching(true);
    setSearched(false);
    setResults([]);
    try {
      const params = new URLSearchParams({ type, prefecture: pref });
      const res = await fetch(`/api/places/search?${params}`);
      if (!res.ok) return;
      const data: SearchResult[] = await res.json();
      setResults(data);
      setSearched(true);
    } catch {
      setSearched(true);
    } finally {
      setFetching(false);
    }
  }

  function handleSelect(r: SearchResult) {
    onSelect({ name: r.name, phone: r.phone || undefined });
    setResults([]);
    setSearched(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-text-primary">
        都道府県から検索{" "}
        <span className="text-text-secondary font-normal">（選択すると候補が表示されます）</span>
      </label>

      <div className="relative">
        <select
          defaultValue=""
          onChange={handlePrefectureChange}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">都道府県を選択</option>
          {PREFECTURES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {fetching && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-text-secondary animate-pulse">検索中…</span>
        )}
      </div>

      {results.length > 0 && (
        <ul className="flex flex-col border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-app-bg border-b border-border last:border-b-0"
              >
                <p className="font-medium text-text-primary">{r.name}</p>
                {r.address && <p className="text-xs text-text-secondary">{r.address}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {searched && !fetching && results.length === 0 && (
        <p className="text-xs text-text-secondary">見つかりませんでした。下のフォームに手動で入力してください。</p>
      )}
    </div>
  );
}
