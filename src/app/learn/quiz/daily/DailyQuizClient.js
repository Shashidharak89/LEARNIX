'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlay, FiClock, FiStar, FiAward, FiChevronDown, FiArrowLeft } from 'react-icons/fi';
import styles from './DailyQuiz.module.css';

export default function DailyQuizClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [dateStr, setDateStr] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [phase, setPhase] = useState('categories'); // categories, intro, playing, results
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const [leaderboard, setLeaderboard] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const categories = [
    { id: 'random', name: 'Mixed Trivia', icon: '🎲', color: '#8b5cf6' },
    { id: 'general', name: 'General Knowledge', icon: '🧠', color: '#3b82f6' },
    { id: 'science', name: 'Science & Nature', icon: '🔬', color: '#10b981' },
    { id: 'computers', name: 'Computers', icon: '💻', color: '#6366f1' },
    { id: 'math', name: 'Mathematics', icon: '📐', color: '#f59e0b' },
    { id: 'sports', name: 'Sports', icon: '⚽', color: '#ef4444' },
    { id: 'geography', name: 'Geography', icon: '🌍', color: '#14b8a6' },
    { id: 'history', name: 'History', icon: '📜', color: '#d97706' },
    { id: 'film', name: 'Movies', icon: '🎬', color: '#ec4899' },
    { id: 'music', name: 'Music', icon: '🎵', color: '#8b5cf6' },
    { id: 'videogames', name: 'Video Games', icon: '🎮', color: '#0ea5e9' },
    { id: 'books', name: 'Books', icon: '📚', color: '#84cc16' },
    { id: 'art', name: 'Art', icon: '🎨', color: '#f43f5e' },
    { id: 'animals', name: 'Animals', icon: '🐾', color: '#a855f7' },
  ];

  // For question rendering
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);

  const fetchDailyQuiz = async (category) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('not_logged_in');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/quiz/daily?category=${category}`, {
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
        fetchLeaderboard(data.quiz.dateStr, category, 1);
      } else {
        setPhase('intro');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (dStr, cat, p) => {
    try {
      const res = await fetch(`/api/quiz/daily/leaderboard?dateStr=${dStr}&category=${cat}&page=${p}`);
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
    // Check login status first, then show categories
    const token = localStorage.getItem('token');
    if (!token) {
      setError('not_logged_in');
    }
    setLoading(false);
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    fetchDailyQuiz(category.id);
  };

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
          category: selectedCategory.id,
          quizDayId: quizData._id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEnrollment(data.enrollment);
        setAlreadyPlayed(true);
        fetchLeaderboard(quizData.dateStr, selectedCategory.id, 1);
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
    fetchLeaderboard(dateStr, selectedCategory.id, nextPage);
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

        {phase === 'categories' && (
          <div>
            <h1 className={styles.title}>Daily Quizzes</h1>
            <p className={styles.subtitle}>Select a category to play today's quiz!</p>
            <div className={styles.categoriesGrid}>
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className={styles.categoryCard} 
                  onClick={() => handleCategorySelect(cat)}
                  style={{ borderTop: `4px solid ${cat.color}` }}
                >
                  <div className={styles.categoryIcon} style={{ backgroundColor: `${cat.color}20` }}>{cat.icon}</div>
                  <h3 className={styles.categoryName}>{cat.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'intro' && quizData && selectedCategory && (
          <div>
            <button className={styles.backLink} onClick={() => setPhase('categories')}>
              <FiArrowLeft /> Back to Categories
            </button>
            <div className={styles.categoryIconLarge} style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}>
              {selectedCategory.icon}
            </div>
            <h1 className={styles.title}>{selectedCategory.name} Challenge</h1>
            <p className={styles.subtitle}>5 new questions every day. Test your knowledge!</p>
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

        {phase === 'results' && selectedCategory && (
          <div>
            <button className={styles.backLink} onClick={() => {
              setPhase('categories');
              setSelectedCategory(null);
            }}>
              <FiArrowLeft /> All Categories
            </button>
            <h1 className={styles.title}>{selectedCategory.name} Results</h1>
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
