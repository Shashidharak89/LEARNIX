'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiPlay, FiArrowRight, FiRefreshCw, FiHome, FiCheckCircle, FiXCircle, FiZap } from 'react-icons/fi';
import styles from './styles/Quiz.module.css';

/* ── helpers ── */
function decodeHtml(html) {
  if (typeof window === 'undefined') return html;
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const LETTERS = ['A', 'B', 'C', 'D'];
const CATEGORIES = [
  { id: 18, label: 'Computers' },
  { id: 9,  label: 'General Knowledge' },
  { id: 17, label: 'Science & Nature' },
  { id: 23, label: 'History' },
  { id: 21, label: 'Sports' },
  { id: 11, label: 'Film' },
];

const DIFFICULTIES = ['any', 'easy', 'medium', 'hard'];
const TYPES = ['any', 'multiple', 'boolean'];

/* ────────────────────────────────────── */
export default function Quiz({ plainBg = false }) {
  const [phase, setPhase]         = useState('setup');    // setup | loading | quiz | report
  const [config, setConfig]       = useState({ category: 18, difficulty: 'any', type: 'any' });
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex]       = useState(0);
  const [answers, setAnswers]     = useState([]);          // { question, correct, yours, isCorrect }
  const [shuffled, setShuffled]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [revealed, setRevealed]   = useState(false);
  const [exiting, setExiting]     = useState(false);
  const [error, setError]         = useState('');

  /* ── fetch questions ── */
  const fetchQuestions = useCallback(async () => {
    setPhase('loading');
    setError('');
    try {
      let url = `https://opentdb.com/api.php?amount=5&category=${config.category}`;
      if (config.difficulty !== 'any') url += `&difficulty=${config.difficulty}`;
      if (config.type !== 'any') url += `&type=${config.type}`;

      const res  = await fetch(url);
      const data = await res.json();

      if (data.response_code !== 0 || !data.results.length) {
        setError('No questions found. Try different settings.');
        setPhase('setup');
        return;
      }

      const qs = data.results.map(q => ({
        ...q,
        question:           decodeHtml(q.question),
        correct_answer:     decodeHtml(q.correct_answer),
        incorrect_answers:  q.incorrect_answers.map(decodeHtml),
      }));

      setQuestions(qs);
      setQIndex(0);
      setAnswers([]);
      setSelected(null);
      setRevealed(false);
      setShuffled(shuffleArray([qs[0].correct_answer, ...qs[0].incorrect_answers]));
      setPhase('quiz');
    } catch {
      setError('Failed to load questions. Check your connection.');
      setPhase('setup');
    }
  }, [config]);

  /* ── prep next question ── */
  const prepQuestion = useCallback((idx, qs) => {
    const q = qs[idx];
    setShuffled(shuffleArray([q.correct_answer, ...q.incorrect_answers]));
    setSelected(null);
    setRevealed(false);
  }, []);

  /* ── answer select ── */
  function handleSelect(answer) {
    if (revealed) return;
    setSelected(answer);
    setRevealed(true);

    const correct = questions[qIndex].correct_answer;
    setAnswers(prev => [...prev, {
      question: questions[qIndex].question,
      correct:  correct,
      yours:    answer,
      isCorrect: answer === correct,
    }]);
  }

  /* ── next question ── */
  function handleNext() {
    const nextIdx = qIndex + 1;
    if (nextIdx >= questions.length) {
      // show report after 5 questions
      setPhase('report');
      return;
    }
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setQIndex(nextIdx);
      prepQuestion(nextIdx, questions);
    }, 280);
  }

  /* ── play again (same config) ── */
  function playAgain() {
    fetchQuestions();
  }

  /* ── go to setup ── */
  function goSetup() {
    setPhase('setup');
    setQuestions([]);
    setAnswers([]);
  }

  /* ── current question helpers ── */
  const currentQ = questions[qIndex];
  const score    = answers.filter(a => a.isCorrect).length;

  const diffClass = {
    easy:   styles.diffEasy,
    medium: styles.diffMedium,
    hard:   styles.diffHard,
  };

  function getScoreEmoji(s, total) {
    const pct = s / total;
    if (pct === 1)    return '🏆';
    if (pct >= 0.8)   return '🎉';
    if (pct >= 0.6)   return '👍';
    if (pct >= 0.4)   return '🤔';
    return '💪';
  }

  /* ══════════════ RENDER ══════════════ */

  /* Setup */
  if (phase === 'setup') return (
    <div className={`${styles.quizRoot} ${plainBg ? styles.plainRoot : ''}`}>
      <div className={styles.setupScreen}>
        <div className={styles.setupLogo}>
          <div className={styles.setupLogoIcon}><FiZap /></div>
          <h1 className={styles.setupTitle}>QuizDeck</h1>
        </div>

        <p className={styles.setupSubtitle}>
          5 questions per round · Instant feedback · Track your score
        </p>

        {error && (
          <div style={{ color: '#dc2626', background: '#fee2e2', border: '1.5px solid #dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className={styles.setupGroup}>
          <label className={styles.setupLabel}>Category</label>
          <select
            className={styles.setupSelect}
            value={config.category}
            onChange={e => setConfig(c => ({ ...c, category: Number(e.target.value) }))}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.setupGroup}>
          <label className={styles.setupLabel}>Difficulty</label>
          <div className={styles.typeButtons}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`${styles.typeBtn} ${config.difficulty === d ? styles.typeBtnActive : ''}`}
                onClick={() => setConfig(c => ({ ...c, difficulty: d }))}
              >
                {d === 'any' ? 'Any' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.setupGroup}>
          <label className={styles.setupLabel}>Question Type</label>
          <div className={styles.typeButtons}>
            {TYPES.map(t => (
              <button
                key={t}
                className={`${styles.typeBtn} ${config.type === t ? styles.typeBtnActive : ''}`}
                onClick={() => setConfig(c => ({ ...c, type: t }))}
              >
                {t === 'any' ? 'Any' : t === 'multiple' ? 'Multi' : 'T / F'}
              </button>
            ))}
          </div>
        </div>

        <button className={styles.startBtn} onClick={fetchQuestions}>
          <FiPlay /> Start Quiz
        </button>
      </div>
    </div>
  );

  /* Loading */
  if (phase === 'loading') return (
    <div className={`${styles.quizRoot} ${plainBg ? styles.plainRoot : ''}`}>
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading questions…</p>
      </div>
    </div>
  );

  /* Report */
  if (phase === 'report') {
    const total = answers.length;
    return (
      <div className={`${styles.quizRoot} ${plainBg ? styles.plainRoot : ''}`}>
        <div className={styles.reportScreen}>
          <div className={styles.reportHeader}>
            <div className={styles.reportEmoji}>{getScoreEmoji(score, total)}</div>
            <h2 className={styles.reportTitle}>Round Complete!</h2>
            <p className={styles.reportSub}>Here&apos;s how you did</p>
          </div>

          <div className={styles.reportScore}>
            <span className={styles.scoreNum}>{score}</span>
            <span className={styles.scoreDenom}>/ {total}</span>
          </div>

          <div className={styles.statRow}>
            <div className={`${styles.statBox} ${styles.statBoxGreen}`}>
              <div className={styles.statNum}>{score}</div>
              <div className={styles.statLabel}>Correct</div>
            </div>
            <div className={`${styles.statBox} ${styles.statBoxRed}`}>
              <div className={styles.statNum}>{total - score}</div>
              <div className={styles.statLabel}>Wrong</div>
            </div>
          </div>

          <div className={styles.reportReview}>
            <p className={styles.reviewTitle}>Review</p>
            {answers.map((a, i) => (
              <div key={i} className={styles.reviewItem}>
                <div className={styles.reviewQ}>{i + 1}. {a.question}</div>
                <div className={styles.reviewAns}>
                  <span className={styles.reviewCorrect}>✓ {a.correct}</span>
                  {!a.isCorrect && (
                    <span className={styles.reviewYours}>✗ {a.yours}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.reportActions}>
            <button className={`${styles.reportBtn} ${styles.reportBtnPrimary}`} onClick={playAgain}>
              <FiRefreshCw /> Play Again
            </button>
            <button className={`${styles.reportBtn} ${styles.reportBtnSecondary}`} onClick={goSetup}>
              <FiHome /> Change Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Quiz */
  return (
    <div className={`${styles.quizRoot} ${plainBg ? styles.plainRoot : ''}`}>
      <div className={styles.quizScreen}>

        {/* Header */}
        <div className={styles.quizHeader}>
          <div className={styles.quizProgress}>
            <div className={styles.progressBarWrap}>
              <div
                className={styles.progressBar}
                style={{ width: `${((qIndex) / questions.length) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>{qIndex + 1} / {questions.length}</span>
          </div>
          <span className={`${styles.diffTag} ${diffClass[currentQ.difficulty] || styles.diffEasy}`}>
            {currentQ.difficulty}
          </span>
        </div>

        {/* Card */}
        <div className={styles.cardScene}>
          <div className={`${styles.card} ${exiting ? styles.cardExiting : ''}`}>

            <div className={styles.qCategory}>
              <FiZap size={12} /> {currentQ.category}
            </div>

            <p className={styles.questionText}>{currentQ.question}</p>

            {/* Answers */}
            <div className={styles.answersGrid}>
              {shuffled.map((ans, i) => {
                const isCorrect  = ans === currentQ.correct_answer;
                const isSelected = ans === selected;
                let cls = styles.answerBtn;
                if (revealed) {
                  cls += ` ${styles.answerDisabled}`;
                  if (isCorrect)                       cls += ` ${styles.answerCorrect}`;
                  else if (isSelected && !isCorrect)   cls += ` ${styles.answerWrong}`;
                }
                return (
                  <button key={ans} className={cls} onClick={() => handleSelect(ans)}>
                    <span className={styles.answerLetter}>{LETTERS[i]}</span>
                    {ans}
                    {revealed && isCorrect && <FiCheckCircle style={{ marginLeft: 'auto', color: '#16a34a' }} />}
                    {revealed && isSelected && !isCorrect && <FiXCircle style={{ marginLeft: 'auto', color: '#dc2626' }} />}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {revealed && (
              <div className={`${styles.feedbackBanner} ${selected === currentQ.correct_answer ? styles.feedbackCorrect : styles.feedbackWrong}`}>
                {selected === currentQ.correct_answer
                  ? <><FiCheckCircle /> Correct! Well done.</>
                  : <><FiXCircle /> Correct answer: <strong>{currentQ.correct_answer}</strong></>
                }
              </div>
            )}

            {/* Next */}
            {revealed && (
              <button className={styles.nextBtn} onClick={handleNext}>
                {qIndex + 1 === questions.length ? 'See Results' : 'Next Question'} <FiArrowRight />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}