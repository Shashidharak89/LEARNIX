import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";

export default function TermsPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>
        <h1>Terms &amp; Conditions</h1>

        <h2>Acceptance of Terms</h2>
        <p>
          By using Learnix, you agree to these Terms &amp; Conditions. If you do
          not agree, do not use the site.
        </p>

        <h2>Use of the Platform</h2>
        <p>
          Learnix provides a platform for sharing study materials and learning
          resources. You agree to use the platform lawfully and respectfully.
        </p>

        <h2>Uploading Materials</h2>
        <p>
          When you upload materials you are responsible for ensuring you have
          the right to share them. Do not upload pirated, copyrighted content
          unless you own the rights or have permission. Keep uploads accurate
          and clearly labeled.
        </p>

        <h2>Copyright Responsibility</h2>
        <p>
          Users retain ownership of their uploads. Learnix does not claim
          ownership of user content; however, by uploading you grant Learnix a
          license to host and display the material. If you believe content
          infringes your rights, use the Report Content process.
        </p>

        <h2>Forbidden Content</h2>
        <p>
          The following content is prohibited: pirated materials, adult or
          pornographic content, hate speech, abusive content, content
          facilitating illegal activity, or any material that violates local
          law. Violations may result in removal and account suspension.
        </p>

        <h2>Account Suspension</h2>
        <p>
          We may suspend or terminate accounts that violate these terms or
          whose activity threatens the platform. Suspensions may occur with or
          without prior notice depending on the severity of the violation.
        </p>

        <h2>Disclaimer of Liability</h2>
        <p>
          Learnix is provided "as is". We are not responsible for user-uploaded
          content, its accuracy, or for any losses arising from use of the
          platform. See our Disclaimer page for further information.
        </p>

        <h2>Governing Law</h2>
        <p>
          These Terms are governed by applicable laws of the jurisdiction where
          Learnix operates. Disputes will be handled in accordance with local
          law.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about these Terms, contact <a href="mailto:learnixp@gmail.com">learnixp@gmail.com</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
