"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, Award } from "lucide-react";

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

  const stepRange = useMemo(() => {
    const start = currentStep * QUESTIONS_PER_STEP;
    const end = Math.min(start + QUESTIONS_PER_STEP, questions.length);
    return { start, end };
  }, [currentStep, questions.length]);

  const currentQuestions = questions.slice(stepRange.start, stepRange.end);
  const isStepSubmitted = submittedSteps[currentStep];

  const allAnswered = useMemo(() => {
    for (let i = stepRange.start; i < stepRange.end; i++) {
      if (answers[i] === null) return false;
    }
    return true;
  }, [answers, stepRange]);

  const canAccessStep = (stepIndex) => {
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
    <div className="qr-wrapper">
      <div className="qr-container">
        {/* Header */}
        <div className="qr-header">
          <button className="qr-back-button" onClick={() => window.history.back()}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div className="qr-title-section">
            <h1 className="qr-main-title">{conceptTitle}</h1>
            <p className="qr-subtitle">Test your knowledge with this interactive quiz</p>
          </div>
        </div>

        {/* Quiz Card */}
        <div className="qr-quiz-card">
          {/* Step Navigation */}
          <div className="qr-step-nav">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`qr-step-pill ${idx === currentStep ? "qr-step-active" : ""} ${submittedSteps[idx] ? "qr-step-complete" : ""}`}
                disabled={!canAccessStep(idx)}
                onClick={() => handleStepClick(idx)}
              >
                <span className="qr-step-number">Step {idx + 1}</span>
                {submittedSteps[idx] && <CheckCircle size={14} />}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="qr-questions-container">
            {currentQuestions.map((q, localIdx) => {
              const globalIdx = stepRange.start + localIdx;
              const selectedOption = answers[globalIdx];
              const correctAnswer = q.answerIndex;

              return (
                <div key={q.id || globalIdx} className="qr-question-block">
                  <div className="qr-question-header">
                    <span className="qr-question-number">{globalIdx + 1}</span>
                    <p className="qr-question-text">{q.question}</p>
                  </div>
                  
                  <div className="qr-options-grid">
                    {q.options.map((option, optIdx) => {
                      let optionClassName = "qr-option-card";
                      
                      if (isStepSubmitted) {
                        if (optIdx === correctAnswer) {
                          optionClassName += " qr-option-correct";
                        } else if (optIdx === selectedOption && selectedOption !== correctAnswer) {
                          optionClassName += " qr-option-wrong";
                        }
                      } else {
                        if (selectedOption === optIdx) {
                          optionClassName += " qr-option-selected";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          className={optionClassName}
                          disabled={isStepSubmitted}
                          onClick={() => handleSelectOption(localIdx, optIdx)}
                        >
                          <span className="qr-option-text">{option}</span>
                          {isStepSubmitted && optIdx === correctAnswer && (
                            <span className="qr-option-badge qr-badge-correct">
                              <CheckCircle size={14} />
                              Correct
                            </span>
                          )}
                          {isStepSubmitted && optIdx === selectedOption && selectedOption !== correctAnswer && (
                            <span className="qr-option-badge qr-badge-wrong">
                              <XCircle size={14} />
                              Wrong
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="qr-actions-bar">
            <div className="qr-action-buttons">
              <button
                type="button"
                className="qr-submit-button"
                disabled={!allAnswered || isStepSubmitted}
                onClick={handleSubmitStep}
              >
                Submit Step {currentStep + 1}
              </button>

              {isStepSubmitted && currentStep < totalSteps - 1 && (
                <button
                  type="button"
                  className="qr-next-button"
                  onClick={handleNextStep}
                >
                  <span>Next Step</span>
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            {!allAnswered && !isStepSubmitted && (
              <span className="qr-hint-text">
                Answer all {stepRange.end - stepRange.start} questions to submit
              </span>
            )}
          </div>

          {/* Score Display */}
          {isStepSubmitted && stepScores[currentStep] !== null && (
            <div className="qr-score-card">
              <Award size={20} />
              <span className="qr-score-text">
                Step {currentStep + 1} Score: <strong>{stepScores[currentStep]}</strong> / {stepRange.end - stepRange.start}
              </span>
              {currentStep === totalSteps - 1 && (
                <span className="qr-complete-badge">Quiz Complete!</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}