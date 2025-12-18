"use client";

import { useState, useMemo } from "react";

const QUESTIONS_PER_STEP = 10;

export default function QuizRunner({ conceptTitle, questions }) {
  const totalSteps = useMemo(
    () => Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_STEP)),
    [questions.length]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [submittedSteps, setSubmittedSteps] = useState(() => Array(totalSteps).fill(false));
  const [stepScores, setStepScores] = useState(() => Array(totalSteps).fill(null));

  // Calculate range of questions for current step
  const stepRange = useMemo(() => {
    const start = currentStep * QUESTIONS_PER_STEP;
    const end = Math.min(start + QUESTIONS_PER_STEP, questions.length);
    return { start, end };
  }, [currentStep, questions.length]);

  const currentQuestions = questions.slice(stepRange.start, stepRange.end);
  const isStepSubmitted = submittedSteps[currentStep];

  // Check if all questions in current step are answered
  const allAnswered = useMemo(() => {
    for (let i = stepRange.start; i < stepRange.end; i++) {
      if (answers[i] === null) return false;
    }
    return true;
  }, [answers, stepRange]);

  // Check if a step can be accessed
  const canAccessStep = (stepIndex) => {
    if (stepIndex === 0) return true;
    // Can access step if all previous steps are submitted
    for (let i = 0; i < stepIndex; i++) {
      if (!submittedSteps[i]) return false;
    }
    return true;
  };

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (isStepSubmitted) return;
    
    const globalIndex = stepRange.start + questionIndex;
    setAnswers((prev) => {
      const updated = [...prev];
      updated[globalIndex] = optionIndex;
      return updated;
    });
  };

  const handleSubmitStep = () => {
    if (!allAnswered || isStepSubmitted) return;

    // Calculate score for this step
    let score = 0;
    for (let i = stepRange.start; i < stepRange.end; i++) {
      if (answers[i] === questions[i].answerIndex) {
        score++;
      }
    }

    setStepScores((prev) => {
      const updated = [...prev];
      updated[currentStep] = score;
      return updated;
    });

    setSubmittedSteps((prev) => {
      const updated = [...prev];
      updated[currentStep] = true;
      return updated;
    });
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1 && submittedSteps[currentStep]) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    if (canAccessStep(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div className="quiz-card">
      <h2 className="quiz-card-title">{conceptTitle} Quiz</h2>

      {/* Step Navigation */}
      <div className="quiz-steps-nav">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`quiz-step-btn ${idx === currentStep ? "active" : ""}`}
            disabled={!canAccessStep(idx)}
            onClick={() => handleStepClick(idx)}
          >
            Step {idx + 1}
            {submittedSteps[idx] ? " ✓" : ""}
          </button>
        ))}
      </div>

      {/* Questions */}
      {currentQuestions.map((q, localIdx) => {
        const globalIdx = stepRange.start + localIdx;
        const selectedOption = answers[globalIdx];

        return (
          <div key={q.id || globalIdx} className="quiz-question">
            <p className="quiz-question-text">
              {globalIdx + 1}. {q.question}
            </p>
            <div className="quiz-options">
              {q.options.map((option, optIdx) => (
                <button
                  key={optIdx}
                  type="button"
                  className={`quiz-option-btn ${selectedOption === optIdx ? "selected" : ""}`}
                  disabled={isStepSubmitted}
                  onClick={() => handleSelectOption(localIdx, optIdx)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="quiz-actions">
        <button
          type="button"
          className="quiz-submit-btn"
          disabled={!allAnswered || isStepSubmitted}
          onClick={handleSubmitStep}
        >
          Submit Step {currentStep + 1}
        </button>

        {isStepSubmitted && currentStep < totalSteps - 1 && (
          <button
            type="button"
            className="quiz-next-btn"
            onClick={handleNextStep}
          >
            Next Step →
          </button>
        )}

        {!allAnswered && !isStepSubmitted && (
          <span className="quiz-hint">
            Answer all {stepRange.end - stepRange.start} questions to submit
          </span>
        )}
      </div>

      {/* Score */}
      {isStepSubmitted && stepScores[currentStep] !== null && (
        <div className="quiz-score">
          ✅ Step {currentStep + 1} Score: {stepScores[currentStep]} / {stepRange.end - stepRange.start}
          {currentStep === totalSteps - 1 && " — Quiz Complete!"}
        </div>
      )}
    </div>
  );
}
