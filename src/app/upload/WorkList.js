"use client";

import { useEffect, useState } from "react";

export default function WorkList() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorks() {
      try {
        const res = await fetch("/api/work");
        const data = await res.json();
        setWorks(data);
      } catch (error) {
        console.error("Error fetching works:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorks();
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Homework Submissions</h1>
      {works.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <div className="space-y-4">
          {works.map((work) => (
            <div
              key={work._id}
              className="border border-gray-300 rounded-lg p-4 shadow-md"
            >
              <h2 className="font-semibold text-lg">{work.subject}</h2>
              <p>
                <strong>Name:</strong> {work.name}
              </p>
              <p>
                <strong>USN:</strong> {work.usn}
              </p>
              <p>
                <strong>Content:</strong> {work.content}
              </p>
              <div className="mt-2">
                <strong>Files:</strong>
                <ul className="list-disc ml-5">
                  {work.files.map((fileUrl, index) => (
                    <li key={index}>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View File {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Submitted on: {new Date(work.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
