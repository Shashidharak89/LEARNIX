import { Suspense } from "react";
import { Navbar } from "../components/Navbar";
import LearnLaterClient from "./LearnLaterClient";

export const metadata = {
  title: "Learn Later | Learnix",
  description: "Keep track of your saved resources, updates, study materials, and question papers to review and learn later.",
};

function LearnLaterLoading() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh",
      padding: "2rem",
    }}>
      <div style={{
        width: "42px",
        height: "42px",
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #007aff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function LearnLaterPage() {
  return (
    <div className="learn-later-root-layout">
      <Navbar />
      <Suspense fallback={<LearnLaterLoading />}>
        <LearnLaterClient />
      </Suspense>
    </div>
  );
}
