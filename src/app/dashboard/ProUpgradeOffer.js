"use client";

import { useEffect, useState } from "react";
import { FiZap, FiClock, FiCheckCircle, FiArrowRight, FiStar } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";

export default function ProUpgradeOffer({ isLoggedIn }) {
  const [plan, setPlan] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [fetchingPlan, setFetchingPlan] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

    if (!isLoggedIn || !token) {
      setFetchingPlan(false);
      return;
    }

    const loadPlan = async () => {
      try {
        const res = await authFetch("/api/user/upgrade-plan", { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch current plan.");
        }

        const currentPlan = String(data?.user?.plan || "basic").toLowerCase();
        setPlan(currentPlan);
        if (typeof window !== "undefined") {
          localStorage.setItem("plan", currentPlan);
        }
      } catch (err) {
        setIsError(true);
        setMessage(err?.message || "Unable to load plan details.");
      } finally {
        setFetchingPlan(false);
      }
    };

    loadPlan();
  }, [isLoggedIn]);

  const handleUpgrade = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await authFetch("/api/user/upgrade-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to upgrade right now.");
      }

      setPlan("pro");
      if (typeof window !== "undefined") {
        localStorage.setItem("plan", "pro");
      }
      setMessage(data?.message || "You are on Pro privileges now.");
      setIsError(false);
    } catch (err) {
      setIsError(true);
      setMessage(err?.message || "Upgrade failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn || fetchingPlan) {
    return null;
  }

  if (plan === "pro") {
    return (
      <section className="learnix-pro-offer learnix-pro-offer-pro" aria-label="Learnix Pro Status">
        <div className="learnix-pro-offer-top">
          <span className="learnix-pro-pill learnix-pro-pill-success">
            <FiStar />
            <span>You Are On Pro</span>
          </span>
        </div>

        <div className="learnix-pro-offer-body">
          <h2 className="learnix-pro-title">You are on Pro privileges.</h2>
          <p className="learnix-pro-subtitle">
            Your Pro features are active now. More features are coming soon.
          </p>

          <div className="learnix-pro-points">
            <div className="learnix-pro-point">
              <FiCheckCircle />
              <span>AI Analyze option on topic images</span>
            </div>
            <div className="learnix-pro-point">
              <FiCheckCircle />
              <span>Summarize complete topic with AI</span>
            </div>
          </div>

          {message && (
            <p className={`learnix-pro-message ${isError ? "learnix-pro-message-error" : "learnix-pro-message-success"}`}>
              {message}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="learnix-pro-offer" aria-label="Learnix Pro Offer">
      <div className="learnix-pro-offer-top">
        <span className="learnix-pro-pill learnix-pro-pill-warning">
          <FiClock />
          <span>Limited Offer</span>
        </span>
        <span className="learnix-pro-pill learnix-pro-pill-accent">
          <FiZap />
          <span>Get Learnix Pro for Free</span>
        </span>
      </div>

      <div className="learnix-pro-offer-body">
        <h2 className="learnix-pro-title">You are on Basic plan. Upgrade to Pro now.</h2>
        <p className="learnix-pro-subtitle">
          Unlock AI image analysis and full topic summarize in one click. This free Pro upgrade is available for a limited time.
        </p>

        <div className="learnix-pro-points">
          <div className="learnix-pro-point">
            <FiCheckCircle />
            <span>AI Analyze option on topic images</span>
          </div>
          <div className="learnix-pro-point">
            <FiCheckCircle />
            <span>Summarize complete topic with AI</span>
          </div>
        </div>

        <button
          type="button"
          className="learnix-pro-upgrade-btn"
          onClick={handleUpgrade}
          disabled={loading}
          title={loading ? "Upgrading your plan..." : "Upgrade to Learnix Pro"}
        >
          <span>{loading ? "Upgrading..." : "Upgrade to Pro"}</span>
          <FiArrowRight />
        </button>

        {message && (
          <p className={`learnix-pro-message ${isError ? "learnix-pro-message-error" : "learnix-pro-message-success"}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
