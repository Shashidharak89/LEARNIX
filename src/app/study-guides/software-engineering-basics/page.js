import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function SoftwareEngineeringBasics() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Software Engineering: Basics and Best Practices</h1>

        <h2>Introduction</h2>
        <p>
          Software engineering is the disciplined approach to designing,
          building, testing, and maintaining software. It covers methodologies,
          architecture, testing, version control, and team collaboration.
          Understanding these fundamentals helps create reliable and
          maintainable systems.
        </p>

        <h2>Development Methodologies</h2>
        <p>
          Agile methodologies (Scrum, Kanban) emphasize iterative development
          with regular feedback. Waterfall is a sequential model suited to
          projects with stable requirements. Choose a methodology that fits
          team size, product maturity, and stakeholder needs.
        </p>

        <h2>Design &amp; Architecture</h2>
        <p>
          Good architecture separates concerns, uses modular components, and
          anticipates change. Architectural patterns include layered
          architecture, microservices, event-driven systems, and RESTful
          services. Document decisions and use diagrams to communicate design
          across teams.
        </p>

        <h2>Testing &amp; Quality Assurance</h2>
        <p>
          Testing is essential: unit tests validate small components, integration
          tests verify interactions, and end-to-end tests simulate real user
          flows. Use CI pipelines to run tests automatically, and adopt code
          review practices to catch issues early.
        </p>

        <h2>Source Control &amp; Collaboration</h2>
        <p>
          Use Git for version control, with branching strategies like Gitflow
          or trunk-based development. Write clear commit messages, and use
          pull requests with reviews to maintain code quality and knowledge
          sharing.
        </p>

        <h2>Deployment &amp; Monitoring</h2>
        <p>
          Automate deployments with CI/CD. Monitor production services using
          logs, metrics, and alerts to detect and respond to incidents. Use
          feature flags to roll out changes safely.
        </p>

        <h2>Security &amp; Privacy</h2>
        <p>
          Follow secure coding practices, minimize attack surface, and
          validate inputs. Protect sensitive data, enforce least privilege,
          and perform regular dependency audits and security testing.
        </p>

        <h2>Continuous Learning</h2>
        <p>
          Software engineering requires continuous learning—read books,
          participate in code reviews, and practice building production-like
          systems. Real-world experience and reflective practice accelerate
          growth.
        </p>
      </main>
      <Footer />
    </div>
  );
}
