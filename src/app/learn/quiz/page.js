import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { listQuizConcepts } from "./quizRegistry";
import "./styles/Quiz.css";

export const metadata = {
  title: "Quiz | LEARNIX",
  description: "Choose a concept and solve quizzes step-by-step.",
};

export default function QuizHomePage() {
  const concepts = listQuizConcepts();

  return (
    <div className="learnix-quiz-page">
      <Navbar />
      <main className="learnix-quiz-wrap">
        <header className="learnix-quiz-head">
          <div>
            <h1 className="learnix-quiz-title">Solve quizzes</h1>
            <p className="learnix-quiz-subtitle">
              Pick a concept. Each step has 10 questions. Submit after answering
              all questions to see your score.
            </p>
          </div>
        </header>

        <section className="learnix-quiz-grid">
          {concepts.map((c) => {
            const isComingSoon = !c.dataFile;
            return (
              <Link key={c.slug} href={`/learn/quiz/${c.slug}`} className="learnix-quiz-concept">
                <span className={`learnix-quiz-chip ${isComingSoon ? "coming" : ""}`}>
                  {isComingSoon ? "Coming soon" : "Ready"}
                </span>
                <h2 className="learnix-quiz-concept-title">{c.title}</h2>
                <p className="learnix-quiz-concept-short">{c.short}</p>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
