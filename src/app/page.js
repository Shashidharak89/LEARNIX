"use client";

import HeroSection from "./components/HeroSection";
import { Navbar } from "./components/Navbar";
import UpdatesBanner from './components/UpdatesBanner';

export default function Home() {

  return (
    <>
    <Navbar/>
    <HeroSection/>
    <UpdatesBanner />
    </>
  );
}
