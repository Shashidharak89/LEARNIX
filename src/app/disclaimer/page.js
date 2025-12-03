import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";

export default function DisclaimerPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>
        <h1>Disclaimer</h1>

        <h2>Accuracy of Content</h2>
        <p>
          Learnix is a platform for sharing educational materials provided by
          users. While we aim to make the site useful, we do not guarantee the
          accuracy, completeness, or reliability of user-uploaded materials.
        </p>

        <h2>Ownership</h2>
        <p>
          Uploaded content remains the property of the users who posted it. We
          do not claim ownership of user materials and are not responsible for
          their content.
        </p>

        <h2>Educational Purpose Only</h2>
        <p>
          Materials on Learnix are provided for educational purposes only and
          should not be relied on as professional advice. Always verify
          important information from authoritative sources.
        </p>

        <h2>No Liability</h2>
        <p>
          Learnix is not liable for any losses, damages or harms resulting
          from use or misuse of the platform or its content. Use materials at
          your own risk.
        </p>

        <h2>Contact</h2>
        <p>
          For concerns about content or this disclaimer, contact <a href="mailto:learnixp@gmail.com">learnixp@gmail.com</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
