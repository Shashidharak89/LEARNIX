"use client";

import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import { Navbar } from "./components/Navbar";
import HillTopAds from "./components/HillTopAds";

export default function Home() {

  return (
    <>
    <Navbar/>
    <HeroSection/>
    <HillTopAds />
    </>
  );
}
