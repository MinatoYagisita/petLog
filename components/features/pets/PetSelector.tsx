"use client";

import { usePets } from "@/contexts/PetContext";
import { cn } from "@/lib/utils";

export function PetSelector() {
  const { pets, activePet, setActivePet } = usePets();

  if (pets.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {pets.map((pet) => (
        <button
          key={pet.id}
          onClick={() => setActivePet(pet)}
          className={cn(
            "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
            activePet?.id === pet.id
              ? "bg-primary text-text-primary"
              : "bg-border text-text-secondary hover:bg-primary/50"
          )}
        >
          {pet.name}
        </button>
      ))}
    </div>
  );
}
