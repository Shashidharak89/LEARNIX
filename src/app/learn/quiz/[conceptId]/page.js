import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import QuizRunner from "./QuizRunner";
import quizData from "../data/quizdata.json";
import "../Quiz.css";

// Import all quiz data files
import dbmsQuiz from "../data/dbms.json";
import dcnQuiz from "../data/dcn.json";
import osQuiz from "../data/os.json";
import focQuiz from "../data/foc.json";

const QUIZ_DATA_MAP = {
  dbms: dbmsQuiz,
  dcn: dcnQuiz,
  os: osQuiz,
  foc: focQuiz,
};

function getConceptById(conceptId) {
  const id = Number(conceptId);
  if (!Number.isFinite(id)) return null;
  return quizData.concepts.find((c) => c.id === id) || null;
}

function getQuizQuestions(concept) {
  if (!concept?.slug) return null;
  return QUIZ_DATA_MAP[concept.slug] || null;
}

export default async function QuizConceptPage({ params }) {
  const { conceptId } = await params;
  
  const concept = getConceptById(conceptId);
  if (!concept) {
    return notFound();
  }

  // Coming soon page
  if (!concept.dataFile) {
    return (
      <div className="quiz-page">
        <Navbar />
        <main className="quiz-container">
          <header className="quiz-detail-header">
            <div>
              <h1 className="quiz-main-title">{concept.title}</h1>
              <p className="quiz-main-subtitle">This quiz is coming soon.</p>
            </div>
            <Link href="/learn/quiz" className="quiz-back-btn">
              ← Back to Quizzes
            </Link>
          </header>
          <div className="quiz-card">
            <div className="quiz-coming-soon">
              🚧 Quiz content is being prepared. Check back soon!
            </div>
          </div>
        </main>
      </div>
    );
  }

  const quizQuestions = getQuizQuestions(concept);
  if (!quizQuestions?.questions?.length) {
    return notFound();
  }

  const totalSteps = Math.ceil(quizQuestions.questions.length / 10);

  return (
    <div className="quiz-page">
      <Navbar />
      <main className="quiz-container">
        <header className="quiz-detail-header">
          <div>
            <h1 className="quiz-main-title">{concept.title}</h1>
            <p className="quiz-main-subtitle">
              {totalSteps} step{totalSteps > 1 ? "s" : ""} • {quizQuestions.questions.length} questions total
            </p>
          </div>
          <Link href="/learn/quiz" className="quiz-back-btn">
            ← Back to Quizzes
          </Link>
        </header>

        <QuizRunner
          conceptTitle={concept.title}
          questions={quizQuestions.questions}
        />
      </main>
    </div>
  );
}
