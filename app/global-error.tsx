"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "sans-serif" }}><div style={{ maxWidth: 560, border: "1px solid #ddd", borderRadius: 16, padding: 28 }}><h1>Viola is temporarily unavailable.</h1><p>Please wait a moment and try again. Your existing booking remains saved in the database.</p>{error.digest ? <p>Reference: {error.digest}</p> : null}<button type="button" onClick={reset} style={{ padding: "10px 16px", cursor: "pointer" }}>Try again</button></div></main></body></html>;
}
