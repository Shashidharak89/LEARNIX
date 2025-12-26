"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import AboutPage from "./AboutPage";
import AboutTitle from "./AboutTitle";
import AutoPlayVideo from "./AutoPlayVideo";
import FeaturesSpotlight from "./FeaturesSpotlight";
import HowItWorksCarousel from "./HowItWorksCarousel";
import MissionVision from "./MissionVision";
import ScrollFeatures from "./ScrollFeatures";
import ValueHighlights from "./ValueHighlights";
import WhatYouDo from "./WhatYouDo";
import WhoYouAre from "./WhoYouAre";
import WhyLearnix from "./WhyLearnix";


export default function about() {

  return (
    <div >
      <Navbar />
      <AboutTitle/>
      <AutoPlayVideo videoUrl="https://res.cloudinary.com/dsojdpkgh/video/upload/v1766751517/zglomku8o9iuxxv99qwx.mp4" />
      <WhoYouAre/>
      <WhatYouDo/>
      <HowItWorksCarousel/>
      <WhyLearnix/>
      <MissionVision/>
      <ValueHighlights/>
      <FeaturesSpotlight/>
      <ScrollFeatures/>
    </div>
  );
}
