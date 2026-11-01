"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Sparkles,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Database,
  Network,
  Cpu,
  Layers,
  Lightbulb,
  Volume2,
  VolumeX,
  ListFilter,
  Play,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Clock,
  User,
  GraduationCap,
  Award
} from "lucide-react";
import { QUIZ_TOPICS } from "./data/quizTopics";
import "./styles/LearnPage.css";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function LearnClient() {
  const router = useRouter();

  // Recommendations state
  const [updates, setUpdates] = useState([]);
  const [resources, setResources] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Learnix Quiz Accordion state
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  // Starting Question Dialog State
  const [modalTopic, setModalTopic] = useState(null);
  const [startingQuestionInput, setStartingQuestionInput] = useState("1");
  const [lastSolvedNum, setLastSolvedNum] = useState(1);

  // Active Quiz State
  const [activeQuizTopic, setActiveQuizTopic] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [showJumpDialog, setShowJumpDialog] = useState(false);

  // Typewriter effect state for active quiz explanation
  const [typedExplanation, setTypedExplanation] = useState("");
  const typewriterTimerRef = useRef(null);

  // Fetch Recommended Updates and Resources
  useEffect(() => {
    let isMounted = true;

    async function fetchRecommendations() {
      try {
        setLoadingRecs(true);
        // 1. Fetch latest updates (take top 3)
        const updatesRes = await fetch("/api/updates/latest?index=1");
        if (updatesRes.ok) {
          const data = await updatesRes.json();
          if (isMounted && data.updates) {
            setUpdates(data.updates.slice(0, 3));
          }
        }

        // 2. Fetch latest resources (take top 2)
        const resourcesRes = await fetch("/api/resources?page=1&size=2");
        if (resourcesRes.ok) {
          const data = await resourcesRes.json();
          if (isMounted && data.topics) {
            setResources(data.topics.slice(0, 2));
          }
        }
      } catch (err) {
        console.warn("Failed to load recommendations:", err);
      } finally {
        if (isMounted) setLoadingRecs(false);
      }
    }

    fetchRecommendations();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to get last solved question number for a topic from localStorage
  const getLastSolved = (slug) => {
    if (typeof window === "undefined") return 1;
    try {
      const val = localStorage.getItem(`learnix_last_solved_${slug}`);
      const parsed = parseInt(val, 10);
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
    } catch {
      return 1;
    }
  };

  // Helper to save last solved question number for a topic
  const setLastSolved = (slug, num) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`learnix_last_solved_${slug}`, num.toString());
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  };

  // Handle clicking a topic card -> opens starting question modal
  const handleOpenStartModal = (topic) => {
    const last = getLastSolved(topic.slug);
    const validStart = Math.min(Math.max(1, last), topic.totalQuestions);
    setLastSolvedNum(last);
    setStartingQuestionInput(validStart.toString());
    setModalTopic(topic);
  };

  // Handle launching the quiz from modal
  const handleStartQuiz = () => {
    if (!modalTopic) return;
    let targetNum = parseInt(startingQuestionInput, 10);
    if (!Number.isFinite(targetNum) || targetNum < 1) targetNum = 1;
    if (targetNum > modalTopic.totalQuestions) targetNum = modalTopic.totalQuestions;

    // Save starting question as current progress
    setLastSolved(modalTopic.slug, targetNum);

    // Load any previously saved answers for this topic from localStorage
    let savedAnswers = {};
    try {
      const stored = localStorage.getItem(`learnix_answers_${modalTopic.slug}`);
      if (stored) savedAnswers = JSON.parse(stored) || {};
    } catch {
      savedAnswers = {};
    }

    setSelectedAnswers(savedAnswers);
    setCurrentQuestionIndex(targetNum - 1);
    setActiveQuizTopic(modalTopic);
    setModalTopic(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Current active question
  const currentQuestion = useMemo(() => {
    if (!activeQuizTopic || !activeQuizTopic.questions) return null;
    return activeQuizTopic.questions[currentQuestionIndex] || null;
  }, [activeQuizTopic, currentQuestionIndex]);

  // Difficulty badge logic matching Android app (Q <= 5 Easy, Q <= 15 Medium, Q > 15 Hard)
  const currentDifficulty = useMemo(() => {
    const qNum = currentQuestionIndex + 1;
    if (qNum <= 5) return { label: "Easy", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" };
    if (qNum <= 15) return { label: "Medium", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" };
    return { label: "Hard", color: "#EF4444", bg: "rgba(239, 68, 68, 0.12)" };
  }, [currentQuestionIndex]);

  // Selected option for current question
  const currentSelectedOption = selectedAnswers[currentQuestionIndex] ?? null;
  const isCurrentAnswered = currentSelectedOption !== null;
  const isCurrentCorrect = isCurrentAnswered && currentQuestion && currentSelectedOption === currentQuestion.answerIndex;

  // Save selected option
  const handleSelectOption = (optionIdx) => {
    if (!activeQuizTopic || isCurrentAnswered) return;

    const newAnswers = { ...selectedAnswers, [currentQuestionIndex]: optionIdx };
    setSelectedAnswers(newAnswers);

    // Save progress to localStorage
    const currentQNum = currentQuestionIndex + 1;
    setLastSolved(activeQuizTopic.slug, currentQNum);
    try {
      localStorage.setItem(`learnix_answers_${activeQuizTopic.slug}`, JSON.stringify(newAnswers));
    } catch (e) {
      console.warn("Could not save answers:", e);
    }
  };

  // Generate an explanation if none is in the JSON
  const questionExplanation = useMemo(() => {
    if (!currentQuestion) return "";
    if (currentQuestion.explanation) return currentQuestion.explanation;

    const correctOptionText = currentQuestion.options[currentQuestion.answerIndex] || "";
    const correctLetter = OPTION_LETTERS[currentQuestion.answerIndex] || "A";

    return `Option ${correctLetter} ("${correctOptionText}") is the correct answer. This fundamental concept in ${activeQuizTopic?.title || "Computer Science"} is essential for system reliability and optimal computational performance.`;
  }, [currentQuestion, activeQuizTopic]);

  // Typewriter effect for explanation card
  useEffect(() => {
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    if (!isCurrentAnswered || !questionExplanation) {
      setTypedExplanation("");
      return;
    }

    setTypedExplanation("");
    let charIndex = 0;
    typewriterTimerRef.current = setInterval(() => {
      charIndex += 2;
      if (charIndex >= questionExplanation.length) {
        setTypedExplanation(questionExplanation);
        clearInterval(typewriterTimerRef.current);
      } else {
        setTypedExplanation(questionExplanation.slice(0, charIndex));
      }
    }, 15);

    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, [isCurrentAnswered, currentQuestionIndex, questionExplanation]);

  // TTS Read aloud logic
  useEffect(() => {
    if (!isSoundEnabled || !currentQuestion || typeof window === "undefined" || !window.speechSynthesis) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    window.speechSynthesis.cancel();
    const optionsText = currentQuestion.options
      .map((opt, i) => `Option ${OPTION_LETTERS[i]}, ${opt}`)
      .join(". ");
    const speechText = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}. ${optionsText}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentQuestion, currentQuestionIndex, isSoundEnabled]);

  // Navigate Questions
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const nextIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(nextIdx);
      if (activeQuizTopic) setLastSolved(activeQuizTopic.slug, nextIdx + 1);
    }
  };

  const handleNextQuestion = () => {
    if (activeQuizTopic && currentQuestionIndex < activeQuizTopic.totalQuestions - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setLastSolved(activeQuizTopic.slug, nextIdx + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!activeQuizTopic) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") handlePrevQuestion();
      if (e.key === "ArrowRight") handleNextQuestion();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQuizTopic, currentQuestionIndex]);

  // Format relative time helper
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  // Render topic icon helper
  const renderTopicIcon = (iconName, color) => {
    const props = { size: 24, color: color || "#007AFF" };
    switch (iconName) {
      case "Database":
        return <Database {...props} />;
      case "Network":
        return <Network {...props} />;
      case "Cpu":
        return <Cpu {...props} />;
      case "Layers":
        return <Layers {...props} />;
      default:
        return <BookOpen {...props} />;
    }
  };

  // =========================================================================
  // ACTIVE QUIZ RUNNER VIEW (One Question per Screen, Apple & Android style)
  // =========================================================================
  if (activeQuizTopic && currentQuestion) {
    const totalQ = activeQuizTopic.totalQuestions;
    const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQ) * 100);

    return (
      <main className="learn-page-main">
        <div className="learn-quiz-runner-wrap">
          {/* Top Bar Navigation */}
          <div className="learn-quiz-top-bar">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
                setActiveQuizTopic(null);
              }}
              className="learn-apple-btn-secondary learn-back-btn"
              title="Return to Learn page"
            >
              <ArrowLeft size={17} />
              <span>Exit Quiz</span>
            </button>

            <div className="learn-quiz-topic-indicator">
              <span className="learn-topic-pill" style={{ color: activeQuizTopic.color, borderColor: activeQuizTopic.color }}>
                {activeQuizTopic.shortTitle}
              </span>
              <div className="learn-progress-pill">
                <span>
                  Question {currentQuestionIndex + 1} of {totalQ}
                </span>
                <div className="learn-progress-track">
                  <div
                    className="learn-progress-fill"
                    style={{ width: `${progressPercent}%`, backgroundColor: activeQuizTopic.color }}
                  />
                </div>
              </div>
            </div>

            <div className="learn-quiz-actions">
              {/* Sound / Reader Button */}
              <button
                onClick={() => setIsSoundEnabled((prev) => !prev)}
                className={`learn-icon-btn ${isSoundEnabled ? "active" : ""}`}
                title={isSoundEnabled ? "Mute question audio" : "Listen to question audio"}
              >
                {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              {/* Jump to Question Button */}
              <button
                onClick={() => setShowJumpDialog(true)}
                className="learn-icon-btn learn-jump-btn"
                title="Jump to question"
              >
                <ListFilter size={18} />
              </button>
            </div>
          </div>

          {/* Question Card (Apple Style Widget) */}
          <div className="learn-apple-card learn-question-card">
            {/* Meta Category & Difficulty Header */}
            <div className="learn-q-card-header">
              <div className="learn-q-badges">
                <span className="learn-category-badge">{activeQuizTopic.title}</span>
                <span
                  className="learn-difficulty-badge"
                  style={{ color: currentDifficulty.color, backgroundColor: currentDifficulty.bg }}
                >
                  {currentDifficulty.label}
                </span>
              </div>
              <span className="learn-q-id-pill">#{currentQuestionIndex + 1}</span>
            </div>

            {/* Question Statement */}
            <div className="learn-q-statement">
              <span className="learn-q-num-prefix" style={{ color: activeQuizTopic.color }}>
                {currentQuestionIndex + 1}.
              </span>
              <h2 className="learn-q-text">{currentQuestion.question}</h2>
            </div>

            <div className="learn-q-divider" />

            {/* Options List */}
            <div className="learn-options-list">
              {currentQuestion.options.map((optionText, optIdx) => {
                const letter = OPTION_LETTERS[optIdx];
                const isSelected = currentSelectedOption === optIdx;
                const isCorrectOption = optIdx === currentQuestion.answerIndex;

                let optionStateClass = "";
                if (isCurrentAnswered) {
                  if (isCorrectOption) {
                    optionStateClass = "option-correct";
                  } else if (isSelected) {
                    optionStateClass = "option-wrong";
                  } else {
                    optionStateClass = "option-dimmed";
                  }
                } else if (isSelected) {
                  optionStateClass = "option-selected";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={isCurrentAnswered}
                    className={`learn-option-btn ${optionStateClass}`}
                  >
                    <div className="learn-option-letter-box">
                      {isCurrentAnswered && isCorrectOption ? (
                        <Check size={16} className="learn-opt-icon check" />
                      ) : isCurrentAnswered && isSelected && !isCorrectOption ? (
                        <X size={16} className="learn-opt-icon xmark" />
                      ) : (
                        <span>{letter}</span>
                      )}
                    </div>
                    <span className="learn-option-text">{optionText}</span>
                  </button>
                );
              })}
            </div>

            {/* Celebration or Incorrect Feedback Banner (matching Android app) */}
            {isCurrentAnswered && (
              <div className={`learn-celebration-banner ${isCurrentCorrect ? "correct" : "incorrect"}`}>
                <div className="learn-banner-icon-wrap">
                  {isCurrentCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div className="learn-banner-text-wrap">
                  <h4>{isCurrentCorrect ? "🎉 Outstanding! You got it right!" : "Not quite! Check the correct answer."}</h4>
                  <p>
                    {isCurrentCorrect
                      ? "Great job, your answer is verified correct!"
                      : `The correct answer is Option ${OPTION_LETTERS[currentQuestion.answerIndex]}: "${
                          currentQuestion.options[currentQuestion.answerIndex]
                        }"`}
                  </p>
                </div>
              </div>
            )}

            {/* Explanation Card (matching TypewriterExplanationCard in Android App) */}
            {isCurrentAnswered && (
              <div className="learn-apple-card learn-explanation-card">
                <div className="learn-exp-header">
                  <div className="learn-exp-icon-box">
                    <Lightbulb size={18} />
                  </div>
                  <h3>Explanation</h3>
                </div>
                <p className="learn-exp-body">
                  {typedExplanation}
                  <span className="learn-typewriter-cursor" />
                </p>
              </div>
            )}
          </div>

          {/* Sticky Bottom Navigation Bar (Docked) */}
          <div className="learn-dock-nav">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="learn-dock-btn learn-dock-btn--prev"
              title="Previous question (←)"
            >
              <ArrowLeft size={18} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setShowJumpDialog(true)}
              className="learn-dock-btn learn-dock-btn--jump"
              title="Jump to question"
            >
              <ListFilter size={18} />
              <span>Jump</span>
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === totalQ - 1}
              className="learn-dock-btn learn-dock-btn--next"
              title="Next question (→)"
            >
              <span>Next</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Jump Dialog Modal */}
        {showJumpDialog && (
          <div className="learn-modal-backdrop" onClick={() => setShowJumpDialog(false)}>
            <div className="learn-apple-modal learn-jump-modal" onClick={(e) => e.stopPropagation()}>
              <div className="learn-modal-header">
                <h3>Jump to Question</h3>
                <button onClick={() => setShowJumpDialog(false)} className="learn-modal-close-btn">
                  <X size={18} />
                </button>
              </div>
              <p className="learn-modal-sub">
                Select any question in {activeQuizTopic.title} (1 to {totalQ}):
              </p>
              <div className="learn-jump-grid">
                {Array.from({ length: totalQ }, (_, i) => {
                  const qNum = i + 1;
                  const isAnswered = selectedAnswers[i] !== undefined;
                  const isCurrent = i === currentQuestionIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentQuestionIndex(i);
                        setLastSolved(activeQuizTopic.slug, qNum);
                        setShowJumpDialog(false);
                      }}
                      className={`learn-jump-item ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""}`}
                    >
                      {qNum}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // =========================================================================
  // MAIN LEARN HUB VIEW (Overview, Recommendations, QuizDeck & Learnix Quiz)
  // =========================================================================
  return (
    <main className="learn-page-main">
      {/* 1. Top Card: Apple Widget Hero */}
      <section className="learn-apple-card learn-hero-widget">
        <div className="learn-hero-content">
          <div className="learn-hero-badge-row">
            <span className="learn-pill-badge">
              <Sparkles size={13} />
              <span>LEARNIX HUB</span>
            </span>
            <span className="learn-stats-chip">4 Practice Tracks</span>
            <span className="learn-stats-chip">110+ Questions</span>
          </div>

          <h1 className="learn-hero-title">Learn</h1>
          <p className="learn-hero-subtitle">
            Strengthen your core computer science fundamentals with interactive widgets, curated campus updates, and step-by-step problem sets.
          </p>
        </div>

        <div className="learn-hero-visual">
          <div className="learn-squircle-hero">
            <GraduationCap size={36} color="#007AFF" />
          </div>
        </div>
      </section>

      {/* 2. Recommended For You Section (Latest 3 Updates + Latest 2 Resources) */}
      <section className="learn-section">
        <div className="learn-section-header">
          <div className="learn-section-title-wrap">
            <span className="learn-section-eyebrow">CURATED FOR YOU</span>
            <h2 className="learn-section-title">Recommended for you</h2>
          </div>
          <span className="learn-recs-count-pill">5 Highlights</span>
        </div>

        <div className="learn-recs-grid">
          {/* Skeleton Loaders */}
          {loadingRecs &&
            Array.from({ length: 5 }, (_, idx) => (
              <div key={idx} className="learn-apple-card learn-rec-card learn-card-skeleton">
                <div className="learn-skel-line w-40" />
                <div className="learn-skel-line w-80" />
                <div className="learn-skel-line w-60" />
              </div>
            ))}

          {/* 3 Latest Updates */}
          {!loadingRecs &&
            updates.map((update) => (
              <Link
                key={update._id}
                href={`/updates?id=${update._id}`}
                className="learn-apple-card learn-rec-card learn-update-card"
              >
                <div className="learn-rec-meta">
                  <span className="learn-type-pill learn-type-pill--update">
                    <Sparkles size={11} />
                    <span>Update</span>
                  </span>
                  <span className="learn-rec-date">{formatTime(update.createdAt)}</span>
                </div>

                <h3 className="learn-rec-title" title={update.title}>
                  {update.title || "Campus Update"}
                </h3>

                <p className="learn-rec-snippet" title={update.content}>
                  {update.content || "Click to view campus announcement details and attachments."}
                </p>

                <div className="learn-rec-footer">
                  <div className="learn-rec-author">
                    {update.profileUrl ? (
                      <img src={update.profileUrl} alt="" className="learn-author-avatar" />
                    ) : (
                      <div className="learn-author-avatar fallback">
                        <User size={10} />
                      </div>
                    )}
                    <span className="learn-author-name">{update.name || update.usn || "Admin"}</span>
                  </div>
                  <ChevronRight size={14} className="learn-rec-arrow" />
                </div>
              </Link>
            ))}

          {/* 2 Latest Resources */}
          {!loadingRecs &&
            resources.map((res) => (
              <Link
                key={res._id}
                href={`/resources?search=${encodeURIComponent(res.topic || "")}`}
                className="learn-apple-card learn-rec-card learn-resource-card"
              >
                <div className="learn-rec-meta">
                  <span className="learn-type-pill learn-type-pill--resource">
                    <BookOpen size={11} />
                    <span>Resource</span>
                  </span>
                  {res.subject && <span className="learn-subject-tag">{res.subject}</span>}
                </div>

                <h3 className="learn-rec-title" title={res.topic}>
                  {res.topic || "Study Resource"}
                </h3>

                <p className="learn-rec-snippet" title={res.description}>
                  {res.description || "Comprehensive notes, question solutions and exam study material."}
                </p>

                <div className="learn-rec-footer">
                  <div className="learn-rec-author">
                    <span className="learn-author-name">
                      {res.userName || res.usn || "Contributor"}
                    </span>
                  </div>
                  <ChevronRight size={14} className="learn-rec-arrow" />
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* 3. "Solve quiz from QuizDeck" Card */}
      <section className="learn-section">
        <div
          onClick={() => router.push("/learn/quiz/quizdeck")}
          className="learn-apple-card learn-quizdeck-card"
          role="button"
          tabIndex={0}
        >
          <div className="learn-qd-left">
            <div className="learn-squircle-icon learn-qd-squircle">
              <Zap size={24} color="#FFFFFF" />
            </div>

            <div className="learn-qd-info">
              <div className="learn-qd-title-row">
                <h3 className="learn-qd-title">Solve quiz from QuizDeck</h3>
                <span className="learn-badge-speed">Flashcards Mode</span>
              </div>
              <p className="learn-qd-desc">
                Engage in rapid-fire CS practice rounds with instant scoring, streak bonuses, and interactive card decks.
              </p>
            </div>
          </div>

          <div className="learn-qd-right">
            <span className="learn-apple-pill-btn">
              <span>Launch QuizDeck</span>
              <ChevronRight size={16} />
            </span>
          </div>
        </div>
      </section>

      {/* 4. "Solve Learnix Quiz" Card (Expandable Accordion) */}
      <section className="learn-section">
        <div className="learn-apple-card learn-quiz-accordion-card">
          {/* Header Row (Toggles accordion) */}
          <div
            className="learn-accordion-header"
            onClick={() => setIsAccordionOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
          >
            <div className="learn-accordion-header-left">
              <div className="learn-squircle-icon learn-lx-squircle">
                <Award size={24} color="#FFFFFF" />
              </div>

              <div className="learn-accordion-titles">
                <div className="learn-accordion-badge-row">
                  <h3 className="learn-accordion-title">Solve Learnix Quiz</h3>
                  <span className="learn-badge-count">{QUIZ_TOPICS.length} Tracks Available</span>
                </div>
                <p className="learn-accordion-sub">
                  Practice questions one by one with real-time feedback, typewriter explanations, and auto-saved progress.
                </p>
              </div>
            </div>

            <div className="learn-accordion-toggle-btn">
              <span className="learn-toggle-label">{isAccordionOpen ? "Collapse" : "Explore Tracks"}</span>
              <div className="learn-toggle-icon-wrap">
                {isAccordionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
          </div>

          {/* Accordion Body: List of Available Topics */}
          {isAccordionOpen && (
            <div className="learn-accordion-body">
              <div className="learn-topics-grid">
                {QUIZ_TOPICS.map((topic) => {
                  const lastSolved = getLastSolved(topic.slug);
                  return (
                    <div
                      key={topic.id}
                      className="learn-topic-widget"
                      onClick={() => handleOpenStartModal(topic)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="learn-topic-top">
                        <div
                          className="learn-topic-squircle"
                          style={{ background: topic.gradient }}
                        >
                          {renderTopicIcon(topic.icon, "#FFFFFF")}
                        </div>

                        <div className="learn-topic-meta-right">
                          <span className="learn-topic-count-pill">{topic.totalQuestions} Questions</span>
                          {lastSolved > 1 && (
                            <span className="learn-last-solved-pill" title="Last attempted question">
                              Resume Q#{lastSolved}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="learn-topic-info">
                        <span className="learn-topic-category" style={{ color: topic.color }}>
                          {topic.category}
                        </span>
                        <h4 className="learn-topic-title">{topic.title}</h4>
                        <p className="learn-topic-desc">{topic.description}</p>
                      </div>

                      <div className="learn-topic-action-row">
                        <span className="learn-topic-start-label" style={{ color: topic.color }}>
                          {lastSolved > 1 ? "Continue Practice" : "Start Quiz"}
                        </span>
                        <div
                          className="learn-topic-play-btn"
                          style={{ backgroundColor: topic.color }}
                        >
                          <Play size={13} fill="#FFFFFF" color="#FFFFFF" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Starting Question Number Popup Modal */}
      {modalTopic && (
        <div className="learn-modal-backdrop" onClick={() => setModalTopic(null)}>
          <div className="learn-apple-modal learn-start-modal" onClick={(e) => e.stopPropagation()}>
            <div className="learn-modal-header">
              <div className="learn-modal-title-left">
                <div
                  className="learn-topic-squircle-sm"
                  style={{ background: modalTopic.gradient }}
                >
                  {renderTopicIcon(modalTopic.icon, "#FFFFFF")}
                </div>
                <div>
                  <h3>Start {modalTopic.title}</h3>
                  <span className="learn-modal-track-label">{modalTopic.category} • {modalTopic.totalQuestions} Questions</span>
                </div>
              </div>

              <button onClick={() => setModalTopic(null)} className="learn-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="learn-modal-body">
              <label className="learn-input-label">Select question number to start from:</label>

              <div className="learn-number-input-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(startingQuestionInput, 10) || 1;
                    if (current > 1) setStartingQuestionInput((current - 1).toString());
                  }}
                  className="learn-stepper-btn"
                >
                  -
                </button>

                <input
                  type="number"
                  min="1"
                  max={modalTopic.totalQuestions}
                  value={startingQuestionInput}
                  onChange={(e) => setStartingQuestionInput(e.target.value)}
                  className="learn-number-input"
                  placeholder="1"
                />

                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(startingQuestionInput, 10) || 1;
                    if (current < modalTopic.totalQuestions) {
                      setStartingQuestionInput((current + 1).toString());
                    }
                  }}
                  className="learn-stepper-btn"
                >
                  +
                </button>
              </div>

              <div className="learn-presets-row">
                <button
                  type="button"
                  onClick={() => setStartingQuestionInput("1")}
                  className={`learn-preset-chip ${startingQuestionInput === "1" ? "active" : ""}`}
                >
                  Question 1 (Start)
                </button>
                {lastSolvedNum > 1 && (
                  <button
                    type="button"
                    onClick={() => setStartingQuestionInput(lastSolvedNum.toString())}
                    className={`learn-preset-chip ${
                      startingQuestionInput === lastSolvedNum.toString() ? "active" : ""
                    }`}
                  >
                    Question {lastSolvedNum} (Last Attempted)
                  </button>
                )}
              </div>

              <p className="learn-modal-hint">
                {lastSolvedNum > 1
                  ? `Your last progress on this topic was Question #${lastSolvedNum}. It is pre-filled above, or you can pick any number between 1 and ${modalTopic.totalQuestions}.`
                  : `By default, starts from Question #1. You can edit this field to any question between 1 and ${modalTopic.totalQuestions}.`}
              </p>
            </div>

            <div className="learn-modal-footer">
              <button
                type="button"
                onClick={() => setModalTopic(null)}
                className="learn-apple-btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartQuiz}
                className="learn-apple-btn-primary"
                style={{ background: modalTopic.gradient }}
              >
                <Play size={14} fill="#FFFFFF" />
                <span>Start Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
