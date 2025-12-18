import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import QuizRunner from "../components/QuizRunner";
import { getQuizConcept, getQuizDataBySlug } from "../quizRegistry";
import "../styles/Quiz.css";

export default function QuizConceptPage({ params }) {
  const slug = params?.slug;
  const concept = getQuizConcept(slug);
  if (!concept) return notFound();

  if (!concept.dataFile) {
    return (
      <div className="learnix-quiz-page">
        <Navbar />
        <main className="learnix-quiz-wrap">
          <header className="learnix-quiz-head">
            <div>
              <h1 className="learnix-quiz-title">{concept.title}</h1>
              <p className="learnix-quiz-subtitle">This quiz will be added soon.</p>
            </div>
            <Link href="/learn/quiz" className="learnix-quiz-secondary" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
              Back
            </Link>
          </header>

          <div className="learnix-quiz-card">
            <div className="learnix-quiz-note">Coming soon.</div>
          </div>
        </main>
      </div>
    );
  }

  const data = getQuizDataBySlug(slug);
  if (!data?.questions?.length) {
    return notFound();
  }

  const steps = Math.ceil(data.questions.length / 10);

  return (
    <div className="learnix-quiz-page">
      <Navbar />
      <main className="learnix-quiz-wrap">
        <header className="learnix-quiz-head">
          <div>
            <h1 className="learnix-quiz-title">{concept.title}</h1>
            <p className="learnix-quiz-subtitle">
              {steps} steps ({data.questions.length} questions). Answer all to submit.
            </p>
          </div>
          <Link href="/learn/quiz" className="learnix-quiz-secondary" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
            Back
          </Link>
        </header>

        <QuizRunner title={concept.title} questions={data.questions} />
      </main>
    </div>
  );
}
