"use client";

import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import ExpandableSection from "../ExpandableSection";
import ListSection from "../ListSection";
import { DEFAULT_IMAGE } from "../helpData";
import "../styles/HelpContent.css";

export default function HelpFeaturesPage() {
  return (
    <div>
      <Navbar />
      <div className="help-content">
        <h1>Help: Learnix Features</h1>
        <p className="help-intro">
          <Link href="/help" className="lx-help-back-link">← Back to Help Center</Link>
          <br />
          A quick user-focused overview of what you can do in Learnix.
        </p>

        <ExpandableSection title="Study Materials">
          <ListSection
            subtitle={null}
            intro="Browse learning content shared by students:"
            items={[
              "Browse Subjects and Topics",
              "Open a Topic to view pages and download",
              "Use Search to quickly find what you need"
            ]}
            imageAlt="Study materials"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Search">
          <ListSection
            subtitle={null}
            intro="Find topics faster using filters and search:"
            items={[
              "Search by keywords",
              "Filter by Subject and Topic",
              "Open uploader profiles (USN) when available"
            ]}
            imageAlt="Search"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Upload & Manage">
          <ListSection
            subtitle={null}
            intro="If you upload content, you can manage it anytime:"
            items={[
              "Create/select Subject and add Topics",
              "Upload files (images/docs) to Topics",
              "Change visibility and remove outdated items"
            ]}
            imageAlt="Upload"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Personal Review/Comment (Private Feedback)">
          <ListSection
            subtitle={null}
            intro="Help improve content with private feedback:"
            items={[
              "Send Feedback/Suggestion/Mistake/Appreciation on a Topic",
              "Uploader gets notifications (bell icon)",
              "Uploader can reply and mark items as read"
            ]}
            imageAlt="Feedback"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Tools">
          <ListSection
            subtitle={null}
            intro="Use built-in tools for quick conversions:"
            items={[
              "Word to PDF conversion (where available)",
              "Download content in a study-friendly format"
            ]}
            imageAlt="Tools"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>

        <ExpandableSection title="Profile">
          <ListSection
            subtitle={null}
            intro="Manage your identity and security:"
            items={[
              "Update profile photo and name",
              "Change password",
              "Keep your account secure"
            ]}
            imageAlt="Profile"
            imageSrc={DEFAULT_IMAGE}
          />
        </ExpandableSection>
      </div>
    </div>
  );
}
