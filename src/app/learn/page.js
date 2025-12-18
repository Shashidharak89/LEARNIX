import { Navbar } from "../components/Navbar";
import Link from "next/link";
import { FiCheckCircle, FiBookOpen } from "react-icons/fi";
import "./styles/LearnPage.css";

export const metadata = {
  title: "Learn | LEARNIX",
  description: "Solve quizzes and learn core CS concepts on LEARNIX.",
};

export default function LearnPage() {
  return (
    <div className="learnix-learn-page">
      <Navbar />
      <main className="learnix-learn-wrap">
        <section className="learnix-learn-hero">
          <h1 className="learnix-learn-title">Learn</h1>
          <p className="learnix-learn-subtitle">
            Solve quizzes step-by-step and strengthen your core CS fundamentals.
          </p>

          <div className="learnix-learn-ctas">
            <Link className="learnix-learn-cta" href="/learn/quiz">
              <FiBookOpen />
              Solve quizzes
            </Link>
          </div>
        </section>

        <section className="learnix-learn-sections">
          <div className="learnix-learn-card">
            <h2>How it works</h2>
            <p>
              Each concept is split into steps of 10 questions. You can submit a
              step only after answering all questions.
            </p>
          </div>

          <div className="learnix-learn-card">
            <h2>Rules</h2>
            <ul className="learnix-learn-bullets">
              <li>
                <FiCheckCircle style={{ marginRight: 8, color: "#2563eb" }} />
                Answer all 10 questions in a step
              </li>
              <li>
                <FiCheckCircle style={{ marginRight: 8, color: "#2563eb" }} />
                Submit to reveal your score
              </li>
              <li>
                <FiCheckCircle style={{ marginRight: 8, color: "#2563eb" }} />
                Move to the next step after submission
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
