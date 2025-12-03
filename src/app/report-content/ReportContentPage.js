import './styles/ReportContentPage.css';

export default function ReportContentPage() {
  return (
    <div className="report-page-container">
      <main className="report-main" role="main">
        <h1 className="report-title">Report Content</h1>

        <h2 className="report-subtitle">How to Report</h2>
        <p className="report-paragraph">
          If you discover copyrighted, inappropriate, abusive, or otherwise
          objectionable content on Learnix, you can report it directly to our
          moderation team through email. Please follow the steps below:
        </p>

        <ol className="report-ol">
          <li>Copy the link of the content you want to report.</li>
          <li>Take screenshots clearly showing the issue.</li>
          <li>
            Mention your <strong>USN</strong> and a short explanation of the
            problem.
          </li>
          <li>
            Email all details to{" "}
            <a className="report-link" href="mailto:learnixp@gmail.com">
              learnixp@gmail.com
            </a>.
          </li>
        </ol>

        <h2 className="report-subtitle">What We Review</h2>
        <p className="report-paragraph">
          Reported content is reviewed for copyright violations, explicit or
          adult material, hate speech, harassment, illegal activities, and other
          policy breaches.
        </p>

        <h2 className="report-subtitle">Moderation Process &amp; Response Time</h2>
        <p className="report-paragraph">
          Our moderation team reviews submitted reports within 48 hours. Some
          cases, especially those involving legal checks or verification, may
          take additional time.
        </p>

        <h2 className="report-subtitle">Urgent Reports</h2>
        <p className="report-paragraph">
          For urgent or sensitive cases, email us directly with the **content
          link**, **screenshots**, and your **USN** at{" "}
          <a className="report-link" href="mailto:learnixp@gmail.com">
            learnixp@gmail.com
          </a>.
        </p>
      </main>
    </div>
  );
}
