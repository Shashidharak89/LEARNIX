'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlay, FiClock, FiStar, FiAward, FiChevronDown } from 'react-icons/fi';
import styles from './DailyQuiz.module.css';

export default function DailyQuizClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [dateStr, setDateStr] = useState('');

  const [phase, setPhase] = useState('intro'); // intro, playing, results
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const [leaderboard, setLeaderboard] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // For question rendering
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);

  const fetchDailyQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('not_logged_in');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/quiz/daily', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch quiz');
      }

      setQuizData(data.quiz);
      setAlreadyPlayed(data.alreadyPlayed);
      setEnrollment(data.enrollment);
      setDateStr(data.quiz.dateStr);

      if (data.alreadyPlayed) {
        setPhase('results');
        fetchLeaderboard(data.quiz.dateStr, 1);
      } else {
        setPhase('intro');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (dStr, p) => {
    try {
      const res = await fetch(`/api/quiz/daily/leaderboard?dateStr=${dStr}&page=${p}`);
      const data = await res.json();
      if (res.ok) {
        if (p === 1) {
          setLeaderboard(data.leaderboard);
        } else {
          setLeaderboard(prev => [...prev, ...data.leaderboard]);
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error("Leaderboard fetch error", err);
    }
  };

  useEffect(() => {
    fetchDailyQuiz();
  }, []);

  useEffect(() => {
    if (phase === 'playing' && quizData?.questions[qIndex]) {
      const q = quizData.questions[qIndex];
      const opts = [q.correct_answer, ...q.incorrect_answers];
      setShuffledOptions(opts.sort(() => Math.random() - 0.5));
      setSelectedOpt(null);
    }
  }, [phase, qIndex, quizData]);

  const startQuiz = () => {
    setPhase('playing');
    setQIndex(0);
    setScore(0);
    setStartTime(performance.now());
  };

  const handleSelect = (opt) => {
    if (selectedOpt) return; // Prevent double clicking
    setSelectedOpt(opt);

    const isCorrect = opt === quizData.questions[qIndex].correct_answer;
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      if (qIndex + 1 < quizData.questions.length) {
        setQIndex(qIndex + 1);
      } else {
        finishQuiz(isCorrect ? score + 1 : score);
      }
    }, 400); // Quick transition
  };

  const finishQuiz = async (finalScore) => {
    const endTime = performance.now();
    const timeTakenMs = Math.round(endTime - startTime);

    setPhase('results');
    setScore(finalScore);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/quiz/daily/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: finalScore,
          timeTakenMs,
          dateStr: quizData.dateStr,
          quizDayId: quizData._id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEnrollment(data.enrollment);
        setAlreadyPlayed(true);
        fetchLeaderboard(quizData.dateStr, 1);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit results');
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeaderboard(dateStr, nextPage);
  };

  const formatTime = (ms) => (ms / 1000).toFixed(2) + "s";

  if (loading) return (
    <div className={styles.root}>
      <div className={styles.loading}>Loading Daily Quiz...</div>
    </div>
  );

  if (error === 'not_logged_in') return (
    <div className={styles.root}>
      <div className={styles.container}>
        <h1 className={styles.title}>Daily Quiz</h1>
        <p className={styles.loginPrompt}>You need to log in to participate in the Daily Quiz.</p>
        <button className={styles.nextBtn} onClick={() => router.push('/login')}>Go to Login</button>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.container}>

        {error && error !== 'not_logged_in' && <div className={styles.error}>{error}</div>}

        {phase === 'intro' && quizData && (
          <div>
            <h1 className={styles.title}>Daily Challenge</h1>
            <p className={styles.subtitle}></p>
            <button className={styles.startBtn} onClick={startQuiz}>
              <FiPlay /> Play Now
            </button>
          </div>
        )}

        {phase === 'playing' && quizData && (
          <div>
            <div className={styles.questionHeader}>
              <span>Question {qIndex + 1} of {quizData.questions.length}</span>
              <span><FiClock /></span>
            </div>

            <h2 className={styles.questionText} dangerouslySetInnerHTML={{ __html: quizData.questions[qIndex].question }} />

            <div className={styles.optionsGrid}>
              {shuffledOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`${styles.optionBtn} ${selectedOpt === opt ? styles.optionSelected : ''}`}
                  onClick={() => handleSelect(opt)}
                  disabled={!!selectedOpt}
                  dangerouslySetInnerHTML={{ __html: opt }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div>
            <h1 className={styles.title}>Results</h1>
            <div className={styles.statRow}>
              <div className={`${styles.statBox} ${styles.statBoxGreen}`}>
                <div className={styles.statNum}>{enrollment ? enrollment.score : score}/5</div>
                <div className={styles.statLabel}><FiStar /> Score</div>
              </div>
              <div className={`${styles.statBox} ${styles.statBoxBlue}`}>
                <div className={styles.statNum}>{enrollment ? formatTime(enrollment.timeTakenMs) : formatTime(0)}</div>
                <div className={styles.statLabel}><FiClock /> Time</div>
              </div>
            </div>

            <div className={styles.leaderboardWrap}>
              <h3 className={styles.leaderboardTitle}><FiAward style={{ color: '#eab308' }} /> Today's Leaderboard</h3>

              <div className={styles.leaderboardList}>
                {leaderboard.map((item, idx) => (
                  <div key={item._id} className={styles.leaderItem}>
                    <div className={styles.leaderRank}>#{idx + 1}</div>
                    <div className={styles.leaderInfo}>
                      <span className={styles.leaderName}>{item.userId?.name || 'Unknown'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.leaderScore}>{item.score} / 5</div>
                      <div className={styles.leaderTime}>{formatTime(item.timeTakenMs)}</div>
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && !loading && (
                  <p style={{ color: '#6b7280', textAlign: 'center' }}>Be the first on the leaderboard!</p>
                )}
              </div>

              {hasMore && (
                <button className={styles.viewMoreBtn} onClick={loadMore}>
                  View More <FiChevronDown />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
