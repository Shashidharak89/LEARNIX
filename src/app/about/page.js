"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import AboutPage from "./AboutPage";
import AboutTitle from "./AboutTitle";
import WhoYouAre from "./WhoYouAre";


export default function about() {

  return (
    <div >
      <Navbar />
      <AboutTitle/>
      <WhoYouAre/>
    </div>
  );
}
