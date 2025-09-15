"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./styles/HeroSection.css";

export default function HeroSection() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const usn = localStorage.getItem("usn");
      if (usn) {
        setLoggedIn(true);
      }
    }
  }, []);

  return (
    <section className="hero-learnix">
      <div className="hero-learnix-content">
        <h1 className="hero-learnix-title">Welcome to <span>LEARNIX</span></h1>
        <p className="hero-learnix-subtitle">
          Share homework, study materials, and build your profile with ease.
        </p>

        {loggedIn ? (
          <p className="hero-learnix-extra">
            You are logged in. Enjoy all features of Learnix 🚀
          </p>
        ) : (
          <p className="hero-learnix-extra">
            Please login to access extra features.{" "}
            <Link href="/login" className="hero-learnix-login-btn">
              Login
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
