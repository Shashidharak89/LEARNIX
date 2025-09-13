"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch all works of the logged-in user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usn = localStorage.getItem("usn");
        const res = await fetch("/api/work");
        const data = await res.json();

        // filter only the logged-in user's works
        const myWorks = data.filter((w) => w.usn === usn);
        setWorks(myWorks);
      } catch (err) {
        console.error("Error fetching works:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Uploaded Works</h2>
      {works.length === 0 ? (
        <p>No works uploaded yet.</p>
      ) : (
        works.map((work) => (
          <div
            key={work._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "20px",
            }}
          >
            <h3>{work.subject}</h3>
            <p>
              <strong>Name:</strong> {work.name}
            </p>
            <p>
              <strong>USN:</strong> {work.usn}
            </p>
            <p>
              <strong>Content:</strong> {work.content}
            </p>

            <div>
              <h4>Files:</h4>
              {(() => {
                // normalize files into an array of URLs
                let files = [];

                if (Array.isArray(work.files)) {
                  files = work.files.map((f) =>
                    typeof f === "string" ? f : f.url
                  );
                } else if (typeof work.files === "object" && work.files !== null) {
                  files = Object.values(work.files);
                }

                return files.length > 0 ? (
                  files.map((fileUrl, idx) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                      {fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={fileUrl}
                          alt={`uploaded-${idx}`}
                          width="120"
                          style={{ borderRadius: "6px" }}
                        />
                      ) : fileUrl.match(/\.pdf$/i) ? (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "blue" }}
                        >
                          📄 View PDF
                        </a>
                      ) : (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "green" }}
                        >
                          📎 Download File
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No files uploaded yet.</p>
                );
              })()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
