"use client";

import { usePets } from "@/contexts/PetContext";
import { cn } from "@/lib/utils";

const PET_EMOJI: Record<string, string> = {
  犬: "🐕", 猫: "🐈", うさぎ: "🐇", 鳥: "🐦", ハムスター: "🐹", その他: "🐾",
};

export function PetSelector() {
  const { pets, activePet, setActivePet } = usePets();

  if (pets.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {pets.map((pet) => {
        const isActive = activePet?.id === pet.id;
        return (
          <button
            key={pet.id}
            onClick={() => setActivePet(pet)}
            className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full overflow-hidden border-2 transition-colors flex items-center justify-center bg-surface text-2xl",
                isActive ? "border-primary" : "border-transparent opacity-60"
              )}
            >
              {pet.photoUrl ? (
                <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <span>{PET_EMOJI[pet.type] ?? "🐾"}</span>
              )}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium max-w-[56px] truncate",
                isActive ? "text-text-primary" : "text-text-secondary"
              )}
            >
              {pet.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
