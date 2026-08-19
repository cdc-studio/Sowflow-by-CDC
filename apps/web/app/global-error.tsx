"use client";

import { useEffect } from "react";

// Fallback for errors thrown by the root layout itself (e.g. a provider
// crashing before ThemeProvider/globals.css can render), so it deliberately
// avoids every app component/util and defines its own <html>/<body> — Next
// replaces the entire root layout with this file when that happens, and
// anything relying on the layout being intact would fail the same way.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root layout error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0b",
          color: "#f5f5f5",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: "0.875rem", color: "#a1a1aa", maxWidth: "28rem", margin: 0 }}>
          SOWFlow hit an unexpected error and couldn&apos;t load. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            background: "#f5f5f5",
            color: "#0a0a0b",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
