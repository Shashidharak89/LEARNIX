// /components/PageSliders.js
import React from "react";
import sliderData from "./SliderData";
import SectionSlider from "./SectionSlider";

export default function PageSliders() {
  return (
    <div>
      {sliderData.map((item, idx) => (
        <SectionSlider
          key={idx}
          title={item.title}
          images={item.images}
          route={item.route}
        />
      ))}
    </div>
  );
}
