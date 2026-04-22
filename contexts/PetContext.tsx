"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api-client";

export interface Pet {
  id: string;
  name: string;
  type: string;
  gender: string | null;
  birthday: string | null;
  size: string | null;
  neutered: boolean | null;
  photoUrl: string | null;
  createdAt: string;
}

interface PetContextValue {
  pets: Pet[];
  activePet: Pet | null;
  setActivePet: (pet: Pet) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PetContext = createContext<PetContextValue | null>(null);

export function PetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePet, setActivePetState] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<Pet[]>("/api/pets", user);
      setPets(data);
      if (data.length > 0 && !activePet) {
        setActivePetState(data[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, activePet]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  function setActivePet(pet: Pet) {
    setActivePetState(pet);
  }

  return (
    <PetContext.Provider value={{ pets, activePet, setActivePet, loading, refresh }}>
      {children}
    </PetContext.Provider>
  );
}

export function usePets() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePets must be used inside PetProvider");
  return ctx;
}
