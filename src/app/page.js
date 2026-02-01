"use client";

import HeroSection from "./components/HeroSection";
import { Navbar } from "./components/Navbar";
import HillTopAds from "./components/HillTopAds";
import VideoAdEmbed from "./components/VideoAdEmbed";
import VastVideoPlayer from "./components/VastVideoPlayer";
import VideoSliderMultiTag from "./components/VideoSliderMultiTag";

export default function Home() {

  return (
    <>
    <Navbar/>
    <HeroSection/>
    <HillTopAds />
    <VastVideoPlayer />
    </>
  );
}
