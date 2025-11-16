"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import HelpContent from "./HelpContent";

export default function HelpPage() {
  return (
    <div>
      <Navbar />
      <HelpContent />
      <Footer />
    </div>
  );
}