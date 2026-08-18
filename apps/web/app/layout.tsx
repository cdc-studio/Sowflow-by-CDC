import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOWFlow",
  description: "Turn discovery calls into signed contracts in minutes.",
};

// Syntactically valid (decodes to "placeholder.clerk.accounts.dev$") but not a
// real Clerk instance — it exists only so `next build` can statically render
// public pages without NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY configured. Auth is
// inert until the real key is set; this fallback is never used once it is.
const FALLBACK_PUBLISHABLE_KEY = "pk_test_cGxhY2Vob2xkZXIuY2xlcmsuYWNjb3VudHMuZGV2JA==";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
