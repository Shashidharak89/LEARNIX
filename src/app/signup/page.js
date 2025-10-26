"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import Signup from "./Signup";

export default function register() {
  return (
    <div>
      <Navbar />
      <Signup />
      <Footer />
    </div>
  );
}
