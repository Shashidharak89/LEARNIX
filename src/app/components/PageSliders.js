import React from "react";
import sliderData from "./SliderData";
import SectionSlider from "./SectionSlider";

export default function PageSliders() {
  return (
    <div className="page-sliders-container">
      {sliderData.map((item, idx) => (
        <SectionSlider
          key={idx}
          title={item.title}
          description={item.description}
          images={item.images}
          route={item.route}
        />
      ))}
    </div>
  );
}