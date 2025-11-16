// components/HelpContent.jsx
"use client";
import ImageSlider from './ImageSlider';
import ExpandableSection from './ExpandableSection';
import StepsSection from './StepsSection';
import ProfileSection from './ProfileSection';
import ListSection from './ListSection';
import {
  STEPS_DATA,
  PROFILE_FEATURES,
  LIST_SECTIONS
} from './helpData';
import './styles/HelpContent.css';

const HelpContent = () => {
  return (
    <div className="help-content">
      <h1>Help Center</h1>
      <p className="help-intro">
        Welcome to Learnix! This guide will help you understand how to use all features
        of our platform effectively.
      </p>

      <ImageSlider />

      <ExpandableSection title="Getting Started">
        <StepsSection steps={STEPS_DATA.gettingStarted} title="Getting Started" />
      </ExpandableSection>

      <ExpandableSection title="Uploading Study Materials">
        <StepsSection steps={STEPS_DATA.uploading} title="Uploading Study Materials" />
      </ExpandableSection>

      <ExpandableSection title="Managing Your Profile">
        <ProfileSection features={PROFILE_FEATURES} />
      </ExpandableSection>

      {LIST_SECTIONS.map((section, index) => (
        <ExpandableSection key={index} title={section.title}>
          <ListSection
            subtitle={section.subtitle}
            intro={section.intro}
            items={section.items}
            imageAlt={section.imageAlt}
            imageSrc={section.imageSrc}
          />
        </ExpandableSection>
      ))}
    </div>
  );
};

export default HelpContent;