import { Navbar } from "../components/Navbar";

export const metadata = {
  title: "Shipping and Delivery Policy | Learnix",
  description: "Learnix shipping and delivery policy.",
};

export default function ShippingDeliveryPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px 28px" }}>
        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
          <h1 style={{ margin: "0 0 10px", color: "#1e3a8a" }}>Shipping and Delivery Policy</h1>
          <p style={{ marginTop: 0, color: "#374151" }}>
            Effective date: March 27, 2026
          </p>

          <h2 style={{ marginBottom: 8, color: "#1f2937", fontSize: 20 }}>Service Nature</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            Learnix is a digital platform. We do not ship physical goods. Access to platform features,
            updates, and digital content is delivered online.
          </p>

          <h2 style={{ marginBottom: 8, color: "#1f2937", fontSize: 20 }}>Digital Delivery</h2>
          <p style={{ color: "#374151", lineHeight: 1.7 }}>
            Account access and digital services are generally available immediately after successful sign-in.
            Any premium feature delivery timelines (when launched) will be listed on this page.
          </p>

          <h2 style={{ marginBottom: 8, color: "#1f2937", fontSize: 20 }}>Support</h2>
          <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: 0 }}>
            If you face delays in access or service activation, contact{" "}
            <a href="mailto:learnixp@gmail.com" style={{ color: "#2563eb" }}>learnixp@gmail.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
