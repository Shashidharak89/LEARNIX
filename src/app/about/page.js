import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";

export default function AboutPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>
        <h1>About Learnix</h1>

        <h2>What is Learnix?</h2>
        <p>
          Learnix is a collaborative educational platform where students can
          upload, share, and discover study materials, assignments, and
          resources. Our goal is to make learning more accessible by enabling
          students to contribute and benefit from a shared pool of knowledge.
        </p>

        <h2>Why Learnix Was Created</h2>
        <p>
          Learnix was created to solve a common problem: students often lack a
          central place to find class-specific resources, past assignments and
          curated study guides. By allowing students to upload and organize
          materials by subject and topic, Learnix helps learners find
          high-quality resources quickly.
        </p>

        <h2>Key Features</h2>
        <ul>
          <li><strong>Upload:</strong> Share homework, notes and study files.</li>
          <li><strong>Study Materials:</strong> Browse organized subjects and topics.</li>
          <li><strong>Tools:</strong> Helpful utilities (converters, viewers) to
            make learning easier.</li>
          <li><strong>Profile:</strong> Build a learning profile and track
            contributions.</li>
        </ul>

        <h2>Vision &amp; Mission</h2>
        <p>
          Our mission is to create an open, trustworthy and collaborative
          learning environment. We envision a community-driven platform where
          students help each other succeed by sharing high-quality educational
          resources.
        </p>

        <h2>Founder</h2>
        <p>
          Learnix was founded by Shashidhara K to empower students with a
          centralized platform for study resources. No personal sensitive
          information is shared here.
        </p>

        <h2>Contact &amp; Links</h2>
        <p>
          For inquiries or partnerships, contact: <a href="mailto:learnixp@gmail.com">learnixp@gmail.com</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
