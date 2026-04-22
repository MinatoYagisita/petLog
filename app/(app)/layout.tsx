"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageSpinner } from "@/components/ui/Spinner";
import { PetProvider } from "@/contexts/PetContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <PetProvider>
      <div className="min-h-screen bg-app-bg">
        <main className="max-w-[480px] mx-auto pb-24">{children}</main>
        <BottomNav />
      </div>
    </PetProvider>
  );
}
