"use client";

import { useState } from "react";
import Login from "../login/Login";
import Signup from "../signup/Signup";
import "../login/styles/Login.css";

export default function AuthCard() {
  const [view, setView] = useState("login");

  const handleSwitch = (v) => {
    setView(v);
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {view === "login" ? (
          <Login onSwitch={handleSwitch} />
        ) : (
          <Signup onSwitch={handleSwitch} />
        )}
      </div>
    </div>
  );
}
