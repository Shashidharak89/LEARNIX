"use client";

import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import ExpandableSection from "../ExpandableSection";
import ListSection from "../ListSection";
import { DEFAULT_IMAGE } from "../helpData";
import "../styles/HelpContent.css";

export default function HelpSubjectsPage() {
  return (
    <div>
      <Navbar />
      <div className="help-content">
        <h1>Help: Subjects</h1>
        <p className="help-intro">
          <Link href="/help" className="lx-help-back-link">← Back to Help Center</Link>
          <br />
          A <strong>Subject</strong> is the top-level container in Learnix (for example: DBMS, OS, CN). Subjects help you
          keep related topics and files organized.
        </p>

        <ExpandableSection title="What is a Subject?">
          <ListSection
            subtitle={null}
            intro="In Learnix, a Subject is like a folder for a course or module. Inside a Subject you will find multiple Topics (each topic contains the actual uploaded pages/files)."
            items={[
              "Subjects group related Topics under one course name",
              "You can browse Subjects in Study Materials and Uploaded Works",
              "Subjects help search results stay organized"
            ]}
            imageAlt="Subjects overview"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="How to Use Subjects (User Perspective)">
          <ListSection
            subtitle={null}
            intro="Typical flow when you want to find content quickly:"
            items={[
              "Open Study Materials or Search",
              "Select a Subject first to narrow down your results",
              "Then pick a Topic inside that Subject to view pages/files"
            ]}
            imageAlt="Using subjects"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Subject Visibility (Public / Private)">
          <ListSection
            subtitle={null}
            intro="Uploaders can control visibility for their Subjects:"
            items={[
              "Public: visible to everyone for study",
              "Private: visible only to the uploader (useful for drafts)",
              "Visibility can be changed later in Upload/Manage"
            ]}
            imageAlt="Subject visibility"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Tips">
          <ListSection
            subtitle={null}
            intro="Best practices that help everyone:"
            items={[
              "Use clear Subject names (include semester if needed)",
              "Avoid duplicate Subjects (use the existing one if it matches)",
              "Keep Topics short and specific (unit-wise or chapter-wise)"
            ]}
            imageAlt="Subject tips"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>
      </div>
    </div>
  );
}
