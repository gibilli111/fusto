"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import Onboarding from "./Onboarding";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <svg viewBox="0 0 100 120" width="36" height="43" className="animate-bounce text-red" aria-hidden="true">
          <path
            d="M15 10 h55 v90 a10 10 0 0 1 -10 10 h-35 a10 10 0 0 1 -10 -10 z"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
          />
          <path
            d="M70 30 h8 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
          />
        </svg>
      </main>
    );
  }

  if (!session) {
    return <Onboarding />;
  }

  return <>{children}</>;
}
