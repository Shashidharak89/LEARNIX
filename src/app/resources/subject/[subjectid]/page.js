"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import WorkSubjectPage from "../../[id]/WorkSubjectPage";
import { authFetch } from "@/lib/clientAuth";

const WorkSubjectPageWrapper = () => {
  const params = useParams();
  const subjectId = params?.subjectid;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subjectId) return;

    const fetchData = async () => {
      try {
        const [res] = await Promise.all([
          authFetch(`/api/work/getbysubjectid/${subjectId}`),
          new Promise((resolve) => setTimeout(resolve, 800)),
        ]);

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch subject");
        }

        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId]);

  const handleShare = (payload) => {
    const url = window.location.href;
    const title = `${payload?.subject?.subject || "Subject"} - ${payload?.user?.name || "Learnix"}`;

    if (navigator.share) {
      navigator
        .share({
          title,
          text: `Check out this subject by ${payload?.user?.name || "the uploader"}`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => alert("Link copied to clipboard!"))
        .catch(() => alert("Failed to copy link"));
    }
  };

  return (
    <div className="wsp-page-wrapper">
      <Navbar />
      <WorkSubjectPage data={data} loading={loading} error={error} onShare={handleShare} />
      <style jsx>{`
        .wsp-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default WorkSubjectPageWrapper;
