"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePets, Pet } from "@/contexts/PetContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState } from "react";

const PET_EMOJI: Record<string, string> = {
  犬: "🐕", 猫: "🐈", うさぎ: "🐇", 鳥: "🐦", ハムスター: "🐹", その他: "🐾",
};
const GENDER_LABEL: Record<string, string> = { male: "オス", female: "メス", unknown: "不明" };
const SIZE_LABEL: Record<string, string> = { small: "小型", medium: "中型", large: "大型" };

export default function PetsPage() {
  const { user } = useAuth();
  const { pets, loading, refresh } = usePets();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(pet: Pet) {
    if (!user) return;
    if (!confirm(`${pet.name} を削除しますか？`)) return;
    setDeleting(pet.id);
    try {
      await api.delete(`/api/pets/${pet.id}`, user);
      toast.success(`${pet.name} を削除しました`);
      refresh();
    } catch {
      toast.error("削除できませんでした");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">ペット管理</h1>
        <Link href="/pets/new">
          <Button size="sm">+ 追加</Button>
        </Link>
      </div>

      {pets.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-text-secondary text-sm">ペットがまだ登録されていません</p>
          <Link href="/pets/new" className="block mt-4">
            <Button>最初のペットを登録する</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {pets.map((pet) => (
            <Card key={pet.id}>
              <div className="flex items-center gap-4">
                {/* Photo or emoji */}
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  {pet.photoUrl ? (
                    <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{PET_EMOJI[pet.type] ?? "🐾"}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary">{pet.name}</p>
                  <p className="text-sm text-text-secondary">{pet.type}
                    {pet.gender && pet.gender !== "unknown" && ` · ${GENDER_LABEL[pet.gender]}`}
                    {pet.size && ` · ${SIZE_LABEL[pet.size]}`}
                  </p>
                  {pet.birthday && (
                    <p className="text-xs text-text-secondary">
                      誕生日: {formatDate(pet.birthday)}
                    </p>
                  )}
                  {pet.neutered !== null && (
                    <p className="text-xs text-text-secondary">
                      去勢・避妊: {pet.neutered ? "済み" : "未"}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link href={`/pets/${pet.id}/edit`}>
                    <Button variant="secondary" size="sm">編集</Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleting === pet.id}
                    onClick={() => handleDelete(pet)}
                  >
                    削除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
