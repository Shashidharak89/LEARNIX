import { Navbar } from "@/app/components/Navbar";
import Link from "next/link";

export default function ChatHomePage() {
  return (
    <div>
      <Navbar />
      <section
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            maxWidth: "620px",
            width: "100%",
            padding: "22px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.3rem", color: "#0f172a" }}>Chat</h1>
          <p style={{ marginTop: "8px", color: "#475569" }}>
            Open any user's profile and click <strong>Chat</strong> to start messaging.
          </p>
          <Link
            href="/search"
            style={{
              display: "inline-block",
              marginTop: "8px",
              textDecoration: "none",
              border: "1px solid #0ea5e9",
              color: "#0369a1",
              background: "#f0f9ff",
              padding: "9px 14px",
              borderRadius: "10px",
              fontWeight: 600,
            }}
          >
            Find users
          </Link>
        </div>
      </section>
    </div>
  );
}
