"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";

interface Listing {
  id: string;
  type: string;
  name: string;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
}

export default function PlaceListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/place-listings/${id}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        return res.json();
      })
      .then((data) => { if (data) setListing(data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner />;

  if (notFound || !listing) {
    return (
      <div className="px-4 pt-6">
        <button onClick={() => router.back()} className="text-text-secondary mb-4 block">← 戻る</button>
        <p className="text-text-secondary text-sm text-center mt-12">施設が見つかりませんでした</p>
      </div>
    );
  }

  const typeLabel = listing.type === "hospital" ? "動物病院" : "トリミングサロン";
  const typeEmoji = listing.type === "hospital" ? "🏥" : "✂️";
  const mapsUrl = listing.lat && listing.lng
    ? `https://www.google.com/maps?q=${listing.lat},${listing.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.name)}`;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4 pb-8">
      <button onClick={() => router.back()} className="text-text-secondary self-start">← 戻る</button>

      {listing.photoUrl ? (
        <img
          src={listing.photoUrl}
          alt={listing.name}
          className="w-full h-48 object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full h-32 rounded-2xl bg-surface border border-border flex items-center justify-center text-5xl">
          {typeEmoji}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-text-primary">{listing.name}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{typeLabel}</p>
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          {listing.phone && (
            <div className="flex items-center gap-3">
              <span className="text-lg">📞</span>
              <a href={`tel:${listing.phone}`} className="text-sm text-text-primary underline">
                {listing.phone}
              </a>
            </div>
          )}
          {listing.address && (
            <div className="flex items-start gap-3">
              <span className="text-lg">📍</span>
              <p className="text-sm text-text-primary">{listing.address}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-lg">🗺️</span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline"
            >
              Googleマップで見る
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
