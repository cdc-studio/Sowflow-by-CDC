import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClerkThemeProvider } from "@/components/ClerkThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOWFlow",
  description: "Turn discovery calls into signed contracts in minutes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning is the documented next-themes requirement:
    // its inline script sets the "dark"/"light" class on <html> before React
    // hydrates, which would otherwise always mismatch the server-rendered
    // markup and log a (harmless, but noisy) hydration warning.
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ClerkThemeProvider>{children}</ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
