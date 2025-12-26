"use client";
import "./styles/HowLearnixWorks.css";
import ImageContainer from "../ImageContainer";

export default function HowLearnixWorks() {
  return (
    <section className="lx-work-section">
      <div className="lx-work-container">
        <ImageContainer imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771791/lioov75raprzyxraof3w.jpg" altText="How Learnix Works" />
        {/* Header */}
        <h2 className="lx-work-title">How Learnix works</h2>
        <p className="lx-work-subtitle">
          Learnix follows a simple and transparent process that allows students
          to access learning resources and share files easily.
        </p>

        {/* Steps */}
        <div className="lx-work-steps">
          <div className="lx-work-step">
            <div className="lx-work-number">1</div>
            <div className="lx-work-content">
              <h4>Explore study materials</h4>
              <p>
                Anyone can explore and download shared study materials without
                logging in. This helps students quickly access useful academic
                resources.
              </p>
            </div>
          </div>

          <div className="lx-work-step">
            <div className="lx-work-number">2</div>
            <div className="lx-work-content">
              <h4>Use file-sharing tools without login</h4>
              <p>
                Learnix provides device-to-device file-sharing tools that can be
                used without creating an account. Users can upload files and
                share them instantly using an access code.
              </p>
            </div>
          </div>

          <div className="lx-work-step">
            <div className="lx-work-number">3</div>
            <div className="lx-work-content">
              <h4>Upload files and get an access code</h4>
              <p>
                For file sharing, users can upload any type of file such as ZIP,
                PDF, images, or documents. After uploading, a unique access code
                is generated to download the file from any device.
              </p>
            </div>
          </div>

          <div className="lx-work-step">
            <div className="lx-work-number">4</div>
            <div className="lx-work-content">
              <h4>Login only for study material uploads</h4>
              <p>
                To upload study materials such as PDFs and images to the learning
                section, users must log in. This helps maintain content quality
                and organization.
              </p>
            </div>
          </div>

          <div className="lx-work-step">
            <div className="lx-work-number">5</div>
            <div className="lx-work-content">
              <h4>Learn and contribute</h4>
              <p>
                Students can learn from shared materials and optionally
                contribute study resources after logging in, helping others in
                the learning community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
