"use client";

import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import ExpandableSection from "../ExpandableSection";
import ListSection from "../ListSection";
import { DEFAULT_IMAGE } from "../helpData";
import "../styles/HelpContent.css";

export default function HelpTopicsPage() {
  return (
    <div>
      <Navbar />
      <div className="help-content">
        <h1>Help: Topics</h1>
        <p className="help-intro">
          <Link href="/help" className="lx-help-back-link">← Back to Help Center</Link>
          <br />
          A <strong>Topic</strong> is a specific chapter/unit inside a Subject. Topics contain the real content: uploaded
          images/pages/files that you can view and download.
        </p>

        <ExpandableSection title="What is a Topic?">
          <ListSection
            subtitle={null}
            intro="Think of a Topic as one focused item you study (example: 'Deadlocks', 'Normalization', 'Sorting'). Inside a Topic you can view the pages/images and download them."
            items={[
              "Topics live inside a Subject",
              "Each Topic contains uploaded files/pages",
              "Topics are what you usually open to read and download"
            ]}
            imageAlt="Topics overview"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Viewing and Downloading">
          <ListSection
            subtitle={null}
            intro="On a Topic page you can:"
            items={[
              "View all uploaded pages/images in order",
              "Download as PDF (sometimes you can select page range)",
              "Use tools like Word→PDF when available"
            ]}
            imageAlt="Topic viewer"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Personal Review/Comment (Private Feedback)">
          <ListSection
            subtitle={null}
            intro="If you find a mistake or want to suggest improvements, you can send private feedback on a Topic:"
            items={[
              "Choose type: Feedback, Suggestion, Mistake, Appreciation",
              "Your review is private (only you and the uploader can see it)",
              "Uploaders can reply, copy, and mark as read from their review page"
            ]}
            imageAlt="Topic feedback"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Tips">
          <ListSection
            subtitle={null}
            intro="To keep Topics useful for others:"
            items={[
              "Use a clear Topic name (Unit/Chapter)",
              "Upload pages in correct order",
              "If you send feedback, be specific (page number + issue)"
            ]}
            imageAlt="Topic tips"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>
      </div>
    </div>
  );
}
