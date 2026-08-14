"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import Onboarding from "./Onboarding";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <span className="animate-bounce text-4xl">🍺</span>
      </main>
    );
  }

  if (!session) {
    return <Onboarding />;
  }

  return <>{children}</>;
}
