"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

// Syntactically valid (decodes to "placeholder.clerk.accounts.dev$") but not a
// real Clerk instance — it exists only so `next build` can statically render
// public pages without NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY configured. Auth is
// inert until the real key is set; this fallback is never used once it is.
const FALLBACK_PUBLISHABLE_KEY = "pk_test_cGxhY2Vob2xkZXIuY2xlcmsuYWNjb3VudHMuZGV2JA==";

export function ClerkThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY}
      appearance={{ baseTheme: resolvedTheme === "dark" ? dark : undefined }}
    >
      {children}
    </ClerkProvider>
  );
}
