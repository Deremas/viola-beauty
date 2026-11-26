"use client";

// This file replaces the root layout, so the home and contact links stay plain anchors.
/* eslint-disable @next/next/no-html-link-for-pages */

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "sans-serif" }}><div style={{ maxWidth: 560, border: "1px solid #ddd", borderRadius: 16, padding: 28 }}><h1>Viola is temporarily unavailable.</h1><p>Please wait a moment and try again. You can return home or call the studio. An existing booking can still be checked with its code.</p><p><a href="/">Home</a> · <a href="/contact">Contact</a></p><button type="button" onClick={reset} style={{ padding: "10px 16px", cursor: "pointer" }}>Try again</button></div></main></body></html>;
}
