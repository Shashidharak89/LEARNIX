import { Navbar } from "../components/Navbar";

export const metadata = {
  title: "Cancellation and Refund Policy | Learnix",
  description: "Learnix cancellation and refund policy.",
};

export default function CancellationRefundPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px 28px" }}>
        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
          <h1 style={{ margin: "0 0 10px", color: "#1e3a8a" }}>Cancellation and Refund Policy</h1>
          <p style={{ marginTop: 0, color: "#374151" }}>
            Effective date: March 27, 2026
          </p>

          <h2 style={{ marginBottom: 8, color: "#1f2937", fontSize: 20 }}>Current Policy</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            Learnix currently provides access to digital content and collaboration features. At this stage,
            paid premium plans are under planning. Until paid subscriptions are launched, cancellation and
            refund requests are handled on a case-by-case basis through support.
          </p>

          <h2 style={{ marginBottom: 8, color: "#1f2937", fontSize: 20 }}>When Premium Plans Launch</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            This page will be updated with detailed terms for plan cancellation windows, eligibility criteria,
            and processing timelines for refunds.
          </p>

          <h2 style={{ marginBottom: 8, color: "#1f2937", fontSize: 20 }}>Contact for Requests</h2>
          <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: 0 }}>
            For cancellation or refund-related questions, contact us at{" "}
            <a href="mailto:learnixp@gmail.com" style={{ color: "#2563eb" }}>learnixp@gmail.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
