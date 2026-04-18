"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FiZap, FiClock, FiCheckCircle, FiArrowRight, FiStar } from "react-icons/fi";

export default function ProUpgradeOffer({ isLoggedIn }) {
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPlan, setFetchingPlan] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const usn = typeof window !== "undefined" ? localStorage.getItem("usn") : "";

    if (!isLoggedIn || (!token && !usn)) {
      setPlan("");
      setFetchingPlan(false);
      return;
    }

    const loadPlan = async () => {
      try {
        const qs = usn ? `?usn=${encodeURIComponent(usn)}` : "";
        const tokenHeader = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/user/upgrade-plan${qs}`, {
          headers: tokenHeader,
          params: { t: Date.now() },
        });
        const data = res.data;

        const userPlan = String(data?.user?.plan || "").trim().toLowerCase();
        const currentPlan = userPlan || "basic";
        setPlan(currentPlan);
      } catch (err) {
        const apiError = err?.response?.data?.error;
        setIsError(true);
        setMessage(apiError || err?.message || "Unable to load plan details.");
      } finally {
        setFetchingPlan(false);
      }
    };

    loadPlan();
  }, [isLoggedIn]);

  const handleUpgrade = async () => {
    const usn = typeof window !== "undefined" ? localStorage.getItem("usn") : "";
    if (!usn) {
      setIsError(true);
      setMessage("USN not found. Please login again.");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const tokenHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post("/api/user/upgrade-plan", { usn, plan: "pro" }, {
        headers: {
          ...tokenHeader,
        },
      });
      const data = res.data;

      setPlan(String(data?.user?.plan || "pro").toLowerCase());
      setMessage(data?.message || "You are on Pro privileges now.");
      setIsError(false);
    } catch (err) {
      const apiError = err?.response?.data?.error;
      setIsError(true);
      setMessage(apiError || err?.message || "Upgrade failed.");
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
          <h2 className="learnix-pro-title">You are already in Pro.</h2>
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
