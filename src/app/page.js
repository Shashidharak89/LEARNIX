"use client";

import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import { Navbar } from "./components/Navbar";
import PageSliders from "./components/PageSliders";

export default function Home() {

  return (
    <>
    <Navbar/>
    <HeroSection/>
      <PageSliders/>
    <Footer/>
    </>
  );
}
