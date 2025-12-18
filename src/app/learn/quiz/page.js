import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import quizData from "./data/quizdata.json";
import "./QuizList.css";

export const metadata = {
  title: "Quiz | LEARNIX",
  description: "Choose a concept and solve quizzes step-by-step.",
};

export default function QuizListPage() {
  const concepts = quizData.concepts;

  return (
    <div className="quiz-page">
      <Navbar />
      <main className="quiz-container">
        <header className="quiz-header">
          <h1 className="quiz-main-title">Solve Quizzes</h1>
          <p className="quiz-main-subtitle">
            Pick a concept below. Each quiz has multiple steps with 10 questions each.
            Answer all questions in a step, then submit to see your score.
          </p>
        </header>

        <section className="quiz-concepts-grid">
          {concepts.map((concept) => {
            const isComingSoon = !concept.dataFile;
            return (
              <Link
                key={concept.id}
                href={`/learn/quiz/${concept.id}`}
                className="quiz-concept-card"
              >
                <span className={`quiz-chip ${isComingSoon ? "coming-soon" : "ready"}`}>
                  {isComingSoon ? "Coming Soon" : "Ready"}
                </span>
                <h2 className="quiz-concept-title">{concept.title}</h2>
                <p className="quiz-concept-desc">{concept.short}</p>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
