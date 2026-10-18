"use client";

export default function GlobalErrorRoot({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0a0f1a",
          color: "#e2e8f0",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Server recovery</h1>
          <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 20 }}>
            A critical error occurred. Click below to reload. ({error.digest || "500"})
          </p>
          <button
            onClick={reset}
            style={{
              background: "#22d3ee",
              color: "#000",
              border: "none",
              borderRadius: 999,
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
