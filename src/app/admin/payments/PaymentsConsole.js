"use client";

import { useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiCreditCard, FiExternalLink, FiLock, FiShield } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./payments.css";

let razorpayScriptPromise;

function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The payment request could not be completed.");
  return data;
}

export default function PaymentsConsole() {
  const [amount, setAmount] = useState("1.00");
  const [description, setDescription] = useState("Learnix payment");
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState(null);
  const [payment, setPayment] = useState(null);
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

  async function startCheckout(event) {
    event.preventDefault();
    setNotice(null);
    setPayment(null);

    const rupees = Number(amount);
    const paise = Math.round(rupees * 100);
    if (!Number.isFinite(rupees) || !Number.isSafeInteger(paise) || paise < 100) {
      setNotice({ type: "error", text: "Enter an amount of at least ₹1.00." });
      return;
    }
    if (!keyId) {
      setNotice({ type: "error", text: "The Razorpay public key is missing. Configure NEXT_PUBLIC_RAZORPAY_KEY_ID and restart the app." });
      return;
    }

    setWorking(true);
    try {
      const checkoutReady = await loadRazorpayCheckout();
      if (!checkoutReady) throw new Error("Razorpay Checkout could not load. Check your connection and try again.");

      const order = await readResponse(await authFetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: paise, description }),
      }));

      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Learnix",
        description: description.trim() || "Learnix payment",
        order_id: order.order_id,
        theme: { color: "#0284c7" },
        modal: {
          ondismiss: () => {
            setWorking(false);
            setNotice({ type: "info", text: "Checkout was closed. No payment was verified." });
          },
        },
        handler: async (checkoutResponse) => {
          try {
            const verified = await readResponse(await authFetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(checkoutResponse),
            }));
            setPayment(verified);
            setNotice({ type: "success", text: "Payment signature verified successfully." });
          } catch (error) {
            setNotice({ type: "error", text: error.message });
          } finally {
            setWorking(false);
          }
        },
      });

      checkout.on("payment.failed", (failure) => {
        const message = failure?.error?.description || failure?.error?.reason || "Payment failed. Please try again.";
        setNotice({ type: "error", text: message });
        setWorking(false);
      });
      checkout.open();
    } catch (error) {
      setNotice({ type: "error", text: error.message });
      setWorking(false);
    }
  }

  return (
    <main className="ap-root">
      <header className="ap-heading">
        <div className="ap-heading-icon"><FiCreditCard size={24} aria-hidden="true" /></div>
        <div>
          <p className="ap-eyebrow">ADMINISTRATION</p>
          <h1>Payments</h1>
          <p className="ap-subtitle">Create a Razorpay order and verify its checkout signature.</p>
        </div>
        {keyId.includes("_test_") && <span className="ap-mode-badge">Test mode</span>}
      </header>

      <div className="ap-layout">
        <section className="ap-card ap-checkout-card">
          <div className="ap-card-heading">
            <span className="ap-card-icon"><FiLock size={18} aria-hidden="true" /></span>
            <div>
              <h2>Start a checkout</h2>
              <p>Razorpay hosts the secure payment form.</p>
            </div>
          </div>

          <form className="ap-form" onSubmit={startCheckout}>
            <label htmlFor="ap-amount">Amount <span>INR</span></label>
            <div className="ap-amount-input">
              <span aria-hidden="true">₹</span>
              <input id="ap-amount" type="number" min="1" step="0.01" inputMode="decimal" required
                value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>

            <label htmlFor="ap-description">Description <span>Optional</span></label>
            <input id="ap-description" className="ap-text-input" type="text" maxLength={200}
              value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this payment for?" />

            <button type="submit" className="ap-pay-button" disabled={working}>
              <FiCreditCard size={17} aria-hidden="true" />
              {working ? "Preparing checkout…" : "Continue to checkout"}
            </button>
          </form>

          {notice && (
            <div className={`ap-notice ap-notice--${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
              {notice.type === "success" ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
              <span>{notice.text}</span>
            </div>
          )}
        </section>

        <aside className="ap-card ap-info-card">
          <span className="ap-info-icon"><FiShield size={20} aria-hidden="true" /></span>
          <h2>Secure by design</h2>
          <p>Orders are created on the server. The key secret stays private, and a payment is reported as verified only after the server checks Razorpay’s HMAC signature.</p>
          <a href="https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/" target="_blank" rel="noreferrer">
            Razorpay Checkout docs <FiExternalLink size={14} aria-hidden="true" />
          </a>
        </aside>
      </div>

      {payment && (
        <section className="ap-card ap-receipt" aria-live="polite">
          <div className="ap-receipt-icon"><FiCheckCircle size={21} aria-hidden="true" /></div>
          <div className="ap-receipt-copy">
            <h2>Verified payment</h2>
            <p>₹{(payment.amount / 100).toFixed(2)} {payment.currency}</p>
            <dl>
              <div><dt>Payment ID</dt><dd>{payment.payment_id}</dd></div>
              <div><dt>Order ID</dt><dd>{payment.order_id}</dd></div>
            </dl>
          </div>
        </section>
      )}
    </main>
  );
}
