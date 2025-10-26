"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import AuthCard from "./Auth";

export default function authPage() {
  return (
    <div>
      <Navbar />
      <AuthCard />
      <Footer />
    </div>
  );
}
