import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";

export default function ReportContentPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>
        <h1>Report Content</h1>

        <h2>How to Report</h2>
        <p>
          If you find copyrighted, inappropriate, abusive or otherwise
          objectionable content on Learnix, you can report it using the
          following steps:
        </p>
        <ol>
          <li>Navigate to the content or upload you want to report.</li>
          <li>Click the Report button (or open the content and choose Report).</li>
          <li>Provide details about why you are reporting the content.</li>
          <li>Submit the report. Our moderation team will review it.</li>
        </ol>

        <h2>What We Review</h2>
        <p>
          Reports are reviewed for copyright infringement, explicit or adult
          content, hate speech, harassment, illegal content, and other policy
          violations.
        </p>

        <h2>Moderation Process &amp; Response Time</h2>
        <p>
          Our moderation team aims to acknowledge reports within 48 hours and
          take action depending on the severity and volume of reports. Some
          cases may take longer if legal review or additional evidence is
          required.
        </p>

        <h2>Contact for Reports</h2>
        <p>
          For copyright takedown notices or urgent reports, email
          <a href="mailto:learnixp@gmail.com">learnixp@gmail.com</a> with full
          details and any supporting documents.
        </p>
      </main>
    </div>
  );
}
