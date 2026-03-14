"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiMessageSquare, FiUser } from "react-icons/fi";
import { MdSupportAgent } from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
import "./SupportChat.css";

export default function SupportChat() {

  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Hi! I'm the Learnix support bot. Ask me anything about the platform."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // API URL
  const API = "https://shashidharak99-learnix-chatbot.hf.space";

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, loading]);

  const send = async () => {

    const q = input.trim();
    if (!q || loading) return;

    setInput("");

    setMessages(prev => [
      ...prev,
      { role: "user", text: q }
    ]);

    setLoading(true);

    try {

      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: q
        })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text: data.answer || "⚠️ No response."
        }
      ]);

    } catch (err) {

      console.error(err);

      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ Server connection failed."
        }
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
              <p className="lx-subtitle">
                AI-powered help, available 24/7
              </p>
            </div>

          </div>

          <div className="lx-status">
            <span className="lx-status-dot" />
            <span className="lx-status-label">Online</span>
          </div>

        </div>

        <div className="lx-divider" />

        {/* Messages */}
        <div className="lx-messages" ref={messagesContainerRef}>

          {messages.map((msg, i) => (

            <div key={i} className={`lx-row lx-row--${msg.role}`}>

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

        </div>

        <div className="lx-divider" />

        {/* Input */}
        <div className="lx-footer">

          <div className="lx-input-wrap">

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
            >
              <FiSend size={16} />
            </button>

          </div>

          <p className="lx-hint">
            <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> new line
          </p>

        </div>

      </div>

    </div>
  );
}