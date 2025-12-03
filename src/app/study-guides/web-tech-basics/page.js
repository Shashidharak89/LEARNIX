import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function WebTechBasics() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Web Technologies: Basics</h1>

        <h2>Introduction</h2>
        <p>
          Web technologies power the modern internet: HTML structures pages,
          CSS styles them, and JavaScript makes them interactive. Understanding
          the basics of front-end and back-end development is key to building
          web applications.
        </p>

        <h2>Frontend Fundamentals</h2>
        <p>
          HTML provides semantic structure through elements like headings,
          paragraphs, lists, and forms. CSS controls layout and presentation
          using selectors, the box model, flexbox, and grid. JavaScript
          manipulates the DOM, handles events, and communicates with servers
          via fetch or XMLHttpRequest.
        </p>

        <h2>Backend Basics</h2>
        <p>
          The backend handles data storage, business logic, authentication,
          and APIs. Common backend technologies include Node.js, Python
          (Django/Flask), Ruby on Rails, and Java-based frameworks. Backends
          often expose REST or GraphQL APIs consumed by frontends.
        </p>

        <h2>Databases &amp; APIs</h2>
        <p>
          Web apps use relational or NoSQL databases for persistence. APIs
          define how frontends and backends communicate. Designing clear
          RESTful endpoints and maintaining versioning ensures maintainability.
        </p>

        <h2>Performance &amp; Accessibility</h2>
        <p>
          Optimize performance by minimizing requests, using caching, and
          compressing assets. Ensure accessibility (WCAG) so that content is
          usable by people with disabilities—use semantic HTML, alt text, and
          keyboard navigation support.
        </p>

        <h2>Practical Learning</h2>
        <p>
          Build small projects like personal websites, to-do apps, and simple
          APIs. Learn modern frameworks such as React, Next.js, or Vue, and
          practice deploying apps to platforms like Vercel, Netlify, or a VPS.
        </p>
        <h2>Modern Tooling &amp; Deployment</h2>
        <p>
          Modern web development uses build tools, bundlers and frameworks to
          streamline development. Tools like Webpack, Vite and Next.js handle
          bundling, SSR/SSG and routing. Learn about CI/CD, automated
          deployments and monitoring. Consider performance budgets and use
          Lighthouse to measure page speed and accessibility.
        </p>

        <h2>Accessibility &amp; SEO</h2>
        <p>
          Accessibility ensures inclusivity—for example, semantic HTML and
          ARIA attributes help screen readers. SEO (search engine
          optimization) improves discoverability. Use meaningful headings,
          meta tags and structured data to help search engines index content.
        </p>
      </main>
      <Footer />
    </div>
  );
}
