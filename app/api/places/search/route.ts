export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";

interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  class: string;
  type: string;
  extratags?: {
    phone?: string;
    "contact:phone"?: string;
    "contact:mobile"?: string;
  } | null;
  address?: {
    road?: string;
    quarter?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

// ペット関連のOSMタイプ
const PET_TYPES = new Set(["veterinary", "pet_grooming", "pet"]);

// ペット関連の名称キーワード
const PET_NAME_KEYWORDS = [
  "ペット", "動物", "トリミング", "グルーミング", "サロン", "クリニック",
  "ホスピタル", "hospital", "clinic", "animal", "pet", "vet", "犬", "猫",
];

function isPetRelated(result: NominatimResult): boolean {
  if (PET_TYPES.has(result.type)) return true;
  const nameLower = result.name.toLowerCase();
  return PET_NAME_KEYWORDS.some((kw) => nameLower.includes(kw.toLowerCase()));
}

function buildAddress(result: NominatimResult): string {
  if (result.address) {
    const a = result.address;
    const parts = [
      a.state,
      a.city ?? a.town ?? a.village,
      a.city_district,
      a.suburb ?? a.quarter ?? a.neighbourhood,
      a.road,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }
  const parts = result.display_name.split(", ");
  return parts.length > 2 ? parts.slice(1, -1).join(" ") : result.display_name;
}

async function nominatimFetch(params: URLSearchParams): Promise<NominatimResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  params.forEach((v, k) => url.searchParams.set(k, v));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("countrycodes", "jp");
  url.searchParams.set("limit", "10");
  url.searchParams.set("accept-language", "ja");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "petLog/1.0 (personal pet health management app)" },
  });
  if (!res.ok) return [];
  return res.json();
}

function toResult(item: NominatimResult) {
  return {
    name: item.name || item.display_name.split(",")[0],
    address: buildAddress(item),
    phone:
      item.extratags?.phone ??
      item.extratags?.["contact:phone"] ??
      item.extratags?.["contact:mobile"] ??
      "",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const prefecture = searchParams.get("prefecture")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";

  if (!prefecture && (!q || q.length < 2)) return Response.json([]);

  try {
    let items: NominatimResult[] = [];

    if (type === "hospital" && !q) {
      // 病院：amenityタイプ検索（名称不問）
      items = await nominatimFetch(
        new URLSearchParams({ amenity: "veterinary", state: prefecture })
      );
    } else if (type === "salon" && !q) {
      // サロン：「トリミング」「ペットサロン」両方で検索してマージ
      const [r1, r2] = await Promise.all([
        nominatimFetch(new URLSearchParams({ q: `${prefecture} トリミング` })),
        nominatimFetch(new URLSearchParams({ q: `${prefecture} ペットサロン` })),
      ]);
      const seen = new Set<number>();
      for (const item of [...r1, ...r2]) {
        if (!seen.has(item.place_id)) {
          seen.add(item.place_id);
          items.push(item);
        }
      }
      // ペット関連かどうかフィルタリング
      items = items.filter(isPetRelated);
    } else if (q) {
      // キーワード検索（都道府県プレフィックス付き）
      const fullQ = prefecture ? `${prefecture} ${q}` : q;
      items = await nominatimFetch(new URLSearchParams({ q: fullQ }));
      if (type) items = items.filter(isPetRelated);
    }

    return Response.json(items.slice(0, 8).map(toResult));
  } catch {
    return Response.json([]);
  }
}
