"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import AboutPage from "./AboutPage";
import AboutTitle from "./AboutTitle";
import FeaturesSpotlight from "./FeaturesSpotlight";
import HowItWorksCarousel from "./HowItWorksCarousel";
import MissionVision from "./MissionVision";
import ValueHighlights from "./ValueHighlights";
import WhatYouDo from "./WhatYouDo";
import WhoYouAre from "./WhoYouAre";
import WhyLearnix from "./WhyLearnix";


export default function about() {

  return (
    <div >
      <Navbar />
      <AboutTitle/>
      <WhoYouAre/>
      <WhatYouDo/>
      <HowItWorksCarousel/>
      <WhyLearnix/>
      <MissionVision/>
      <ValueHighlights/>
      <FeaturesSpotlight/>
    </div>
  );
}
