"use client";

import { useMemo, useState } from "react";

const STEP_SIZE = 10;

export default function QuizRunner({ title, questions }) {
  const stepCount = useMemo(
    () => Math.max(1, Math.ceil((questions?.length || 0) / STEP_SIZE)),
    [questions]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [submittedSteps, setSubmittedSteps] = useState(() => Array(stepCount).fill(false));
  const [stepScores, setStepScores] = useState(() => Array(stepCount).fill(null));

  const range = useMemo(() => {
    const start = currentStep * STEP_SIZE;
    const end = Math.min(start + STEP_SIZE, questions.length);
    return { start, end };
  }, [currentStep, questions.length]);

  const stepQuestions = questions.slice(range.start, range.end);

  const allAnswered = useMemo(() => {
    for (let i = range.start; i < range.end; i += 1) {
      if (answers[i] === null || answers[i] === undefined) return false;
    }
    return true;
  }, [answers, range.end, range.start]);

  const isSubmitted = submittedSteps[currentStep];

  const canOpenStep = (stepIndex) => {
    if (stepIndex === 0) return true;
    for (let i = 0; i < stepIndex; i += 1) {
      if (!submittedSteps[i]) return false;
    }
    return true;
  };

  const handlePick = (globalIndex, optionIndex) => {
    if (isSubmitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[globalIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!allAnswered || isSubmitted) return;

    let score = 0;
    for (let i = range.start; i < range.end; i += 1) {
      if (answers[i] === questions[i].answerIndex) score += 1;
    }

    setStepScores((prev) => {
      const next = [...prev];
      next[currentStep] = score;
      return next;
    });

    setSubmittedSteps((prev) => {
      const next = [...prev];
      next[currentStep] = true;
      return next;
    });
  };

  const handleNext = () => {
    if (!submittedSteps[currentStep]) return;
    if (currentStep >= stepCount - 1) return;
    setCurrentStep((s) => s + 1);
  };

  return (
    <div className="learnix-quiz-card">
      <div style={{ marginBottom: 10, fontWeight: 900, color: "#111827" }}>{title}</div>

      <div className="learnix-quiz-steps">
        {Array.from({ length: stepCount }).map((_, i) => (
          <button
            key={i}
            className={`learnix-quiz-stepbtn ${i === currentStep ? "active" : ""}`}
            disabled={!canOpenStep(i)}
            onClick={() => setCurrentStep(i)}
            type="button"
          >
            Step {i + 1}{submittedSteps[i] ? " ✓" : ""}
          </button>
        ))}
      </div>

      {stepQuestions.map((q, localIndex) => {
        const globalIndex = range.start + localIndex;
        return (
          <div key={q.id ?? globalIndex} className="learnix-quiz-q">
            <div className="learnix-quiz-qtitle">
              {globalIndex + 1}. {q.question}
            </div>
            <div className="learnix-quiz-options">
              {q.options.map((opt, optIndex) => {
                const selected = answers[globalIndex] === optIndex;
                return (
                  <button
                    key={optIndex}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handlePick(globalIndex, optIndex)}
                    className={`learnix-quiz-opt ${selected ? "selected" : ""}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="learnix-quiz-actions">
        <button
          type="button"
          className="learnix-quiz-primary"
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitted}
        >
          Submit step
        </button>

        {isSubmitted && currentStep < stepCount - 1 ? (
          <button type="button" className="learnix-quiz-secondary" onClick={handleNext}>
            Next step
          </button>
        ) : null}

        {!allAnswered && !isSubmitted ? (
          <div className="learnix-quiz-note">Answer all questions to enable submit.</div>
        ) : null}
      </div>

      {isSubmitted ? (
        <div className="learnix-quiz-score">
          Score: {stepScores[currentStep]}/{range.end - range.start}
          {currentStep === stepCount - 1 ? " (step completed)" : ""}
        </div>
      ) : null}
    </div>
  );
}
