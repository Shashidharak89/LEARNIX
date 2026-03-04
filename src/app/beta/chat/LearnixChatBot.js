"use client";

import { useState } from "react";
import { Client } from "@gradio/client";

export default function LearnixChatbot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askBot = async () => {
    if (!question) return;

    setLoading(true);

    try {
      const client = await Client.connect("shashidharak99/learnix-chatbot");

      const result = await client.predict("/chat", {
        question: question,
      });

      setAnswer(result.data);
    } catch (err) {
      console.error(err);
      setAnswer("Error contacting chatbot.");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Learnix Chatbot</h2>

      <input
        type="text"
        placeholder="Ask something..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={askBot}
        style={{
          padding: "10px 20px",
          background: "#ff6a00",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Thinking..." : "Ask"}
      </button>

      {answer && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #eee",
            background: "#f9f9f9",
          }}
        >
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}