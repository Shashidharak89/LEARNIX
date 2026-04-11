"use client";

import { useState } from "react";
import { FiHelpCircle, FiMessageSquare, FiSend } from "react-icons/fi";
import "./styles/HomeGroqAskBox.css";

export default function HomeGroqAskBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askQuestion = async (event) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/groq-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Unable to get an answer right now.");
        setAnswer("");
        return;
      }

      setAnswer(data?.answer || "No answer received.");
    } catch {
      setError("Network error. Please try again.");
      setAnswer("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hgq-wrap" aria-label="Ask Learnix assistant">
      <div className="hgq-glow hgq-glow-a" />
      <div className="hgq-glow hgq-glow-b" />

      <div className="hgq-content">
        <h3 className="hgq-title">
          <FiMessageSquare size={16} /> Ask Learnix Assistant
        </h3>
        <p className="hgq-subtitle">
          Ask any study question and get a quick AI response.
        </p>

        <form onSubmit={askQuestion} className="hgq-form">
          <textarea
            className="hgq-textarea"
            placeholder="Example: Explain Newton's laws in simple words"
            value={question}
            maxLength={800}
            onChange={(event) => setQuestion(event.target.value)}
          />

          <button
            className="hgq-submit"
            type="submit"
            disabled={loading || !question.trim()}
          >
            <FiSend size={14} /> {loading ? "Thinking..." : "Ask"}
          </button>
        </form>

        {error && (
          <p className="hgq-error">
            <FiHelpCircle size={14} /> {error}
          </p>
        )}

        {answer && (
          <article className="hgq-answer">
            <h4>Answer</h4>
            <p>{answer}</p>
          </article>
        )}
      </div>
    </section>
  );
}
