"use client";

import { useState, useRef, useEffect } from "react";
import { Client } from "@gradio/client";
import { FiSend, FiMessageSquare, FiUser } from "react-icons/fi";
import { MdSupportAgent } from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
import "./SupportChat.css";

export default function SupportChat() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Hi! I'm the Learnix support bot. Ask me anything about the platform — subjects, uploads, works, accounts, or anything else!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  // Scroll only the messages container, not the page
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const client = await Client.connect("shashidharak99/learnix-chatbot");
      const result = await client.predict("/chat", { question: q });
      const reply = Array.isArray(result.data) ? result.data[0] : result.data;
      setMessages((prev) => [...prev, { role: "bot", text: String(reply) }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ Sorry, I couldn't reach the support server. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`lx-page ${isLoaded ? "lx-page--loaded" : ""}`}>
      <div className="lx-card">
        {/* Header */}
        <div className="lx-header">
          <div className="lx-header-left">
            <div className="lx-header-icon">
              <RiRobot2Line size={22} />
            </div>
            <div>
              <h1 className="lx-title">
                Learnix <span className="lx-title-accent">Support</span>
              </h1>
              <p className="lx-subtitle">AI-powered help, available 24/7</p>
            </div>
          </div>
          <div className="lx-status">
            <span className="lx-status-dot" />
            <span className="lx-status-label">Online</span>
          </div>
        </div>

        {/* Divider */}
        <div className="lx-divider" />

        {/* Messages */}
        <div className="lx-messages" ref={messagesContainerRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`lx-row lx-row--${msg.role}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {msg.role === "bot" && (
                <div className="lx-avatar lx-avatar--bot">
                  <MdSupportAgent size={15} />
                </div>
              )}
              <div className={`lx-bubble lx-bubble--${msg.role}`}>
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="lx-avatar lx-avatar--user">
                  <FiUser size={13} />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="lx-row lx-row--bot">
              <div className="lx-avatar lx-avatar--bot">
                <MdSupportAgent size={15} />
              </div>
              <div className="lx-bubble lx-bubble--bot lx-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Divider */}
        <div className="lx-divider" />

        {/* Input area */}
        <div className="lx-footer">
          <div className={`lx-input-wrap ${loading ? "lx-input-wrap--disabled" : ""}`}>
            <FiMessageSquare className="lx-input-icon" size={16} />
            <textarea
              ref={inputRef}
              className="lx-textarea"
              placeholder="Type your question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              rows={1}
            />
            <button
              className="lx-send-btn"
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <FiSend size={16} />
            </button>
          </div>
          <p className="lx-hint">
            <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}