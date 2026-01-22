'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { hapticTap, hapticSuccess } from '@/lib/haptics';
import { UserWissenState, WissenBadge } from '@/lib/wissen/types';
import {
  getArticleById,
  getNextArticle,
  getTotalArticleCount,
} from '@/lib/wissen/articles';
import {
  loadWissenProgress,
  completeArticleQuiz,
  markArticleRead,
} from '@/lib/wissen/progress';
import { getUnlockedBadges } from '@/lib/wissen/badges';
import ArticleContent from '@/components/wissen/ArticleContent';
import WissenQuizQuestion from '@/components/wissen/WissenQuizQuestion';
import { BadgeUnlockAnimation } from '@/components/wissen/BadgeDisplay';

type Phase = 'content' | 'quiz' | 'result';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.articleId as string;

  const article = getArticleById(articleId);

  const [progress, setProgress] = useState<UserWissenState | null>(null);
  const [phase, setPhase] = useState<Phase>('content');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [newBadge, setNewBadge] = useState<WissenBadge | null>(null);

  useEffect(() => {
    const loadedProgress = loadWissenProgress();
    setProgress(loadedProgress);

    // Artikel als gelesen markieren
    if (article && loadedProgress) {
      const updated = markArticleRead(loadedProgress, articleId);
      setProgress(updated);
    }
  }, [articleId, article]);

  // Badge-Animation ausblenden nach 3 Sekunden
  useEffect(() => {
    if (newBadge) {
      const timer = setTimeout(() => setNewBadge(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [newBadge]);

  if (!article) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl text-amber-400 mb-4">Artikel nicht gefunden</h1>
          <Link href="/wissen" className="text-amber-300 underline">
            Zurueck zur Uebersicht
          </Link>
        </div>
      </main>
    );
  }

  const handleStartQuiz = () => {
    hapticTap();
    setPhase('quiz');
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
  };

  const handleQuizAnswer = (correct: boolean) => {
    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
    }

    // Naechste Frage oder Ergebnis
    if (currentQuestionIndex < article.quiz.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 500);
    } else {
      // Quiz beendet
      setTimeout(() => {
        const score = Math.round(
          ((correctAnswers + (correct ? 1 : 0)) / article.quiz.length) * 100
        );

        // Fortschritt speichern
        if (progress) {
          const { newState, newBadges } = completeArticleQuiz(
            progress,
            articleId,
            score,
            getTotalArticleCount(),
            (state) => getUnlockedBadges(state, [article])
          );
          setProgress(newState);

          // Badge-Animation zeigen
          if (newBadges.length > 0) {
            setNewBadge(newBadges[0]);
          }
        }

        if (score >= 70) {
          hapticSuccess();
        }
        setPhase('result');
      }, 1500);
    }
  };

  const quizScore =
    article.quiz.length > 0
      ? Math.round((correctAnswers / article.quiz.length) * 100)
      : 100;

  const passed = quizScore >= 70;
  const nextArticle = getNextArticle(articleId);

  return (
    <main className="min-h-screen p-4 safe-area-top safe-area-bottom">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="pt-4 mb-6">
          <Link
            href={`/wissen/${article.category}`}
            className="text-amber-400 text-sm hover:text-amber-300"
            onClick={() => hapticTap()}
          >
            &larr; Zurueck zur Kategorie
          </Link>
          <h1 className="text-2xl font-bold text-amber-400 mt-2">
            {article.title}
          </h1>
          {article.titleBavarian && (
            <p className="text-amber-100/60 italic">{article.titleBavarian}</p>
          )}
        </div>

        {/* Content Phase */}
        {phase === 'content' && (
          <div className="space-y-6">
            <ArticleContent sections={article.content} />

            {/* Zum Quiz Button */}
            {article.quiz.length > 0 && (
              <div className="pt-6 border-t border-amber-800/30">
                <button
                  onClick={handleStartQuiz}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02]"
                  style={{
                    background:
                      'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: 'white',
                  }}
                >
                  Quiz starten ({article.quiz.length} Fragen)
                </button>
              </div>
            )}

            {/* Kein Quiz - direkt abschliessen */}
            {article.quiz.length === 0 && (
              <div className="pt-6 border-t border-amber-800/30">
                <button
                  onClick={() => {
                    if (progress) {
                      const { newState, newBadges } = completeArticleQuiz(
                        progress,
                        articleId,
                        100,
                        getTotalArticleCount(),
                        (state) => getUnlockedBadges(state, [article])
                      );
                      setProgress(newState);
                      if (newBadges.length > 0) {
                        setNewBadge(newBadges[0]);
                      }
                    }
                    hapticSuccess();
                    router.push(`/wissen/${article.category}`);
                  }}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02]"
                  style={{
                    background:
                      'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                  }}
                >
                  Artikel abschliessen ✓
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quiz Phase */}
        {phase === 'quiz' && article.quiz[currentQuestionIndex] && (
          <div
            className="rounded-xl p-5"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '1px solid rgba(139,90,43,0.5)',
            }}
          >
            <WissenQuizQuestion
              key={article.quiz[currentQuestionIndex].id}
              question={article.quiz[currentQuestionIndex]}
              onAnswer={handleQuizAnswer}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={article.quiz.length}
            />
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && (
          <div className="space-y-6">
            {/* Ergebnis-Karte */}
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background: passed
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              }}
            >
              <div className="text-5xl mb-3">{passed ? '🎉' : '😕'}</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {passed ? 'Geschafft!' : 'Nicht bestanden'}
              </h2>
              <p className="text-white/80">
                Du hast {correctAnswers} von {article.quiz.length} Fragen richtig
                beantwortet.
              </p>
              <div className="mt-4 text-4xl font-bold text-white">
                {quizScore}%
              </div>
              {!passed && (
                <p className="text-white/60 text-sm mt-2">
                  Du brauchst mindestens 70% zum Bestehen.
                </p>
              )}
            </div>

            {/* Aktionen */}
            <div className="space-y-3">
              {!passed && (
                <button
                  onClick={() => {
                    hapticTap();
                    setPhase('content');
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-amber-200 border border-amber-700 hover:bg-amber-900/30 transition-all"
                >
                  Artikel wiederholen
                </button>
              )}

              {passed && nextArticle && (
                <button
                  onClick={() => {
                    hapticTap();
                    router.push(`/wissen/artikel/${nextArticle.id}`);
                  }}
                  className="w-full py-3 rounded-xl font-semibold transition-all"
                  style={{
                    background:
                      'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: 'white',
                  }}
                >
                  Naechster Artikel: {nextArticle.title}
                </button>
              )}

              <button
                onClick={() => {
                  hapticTap();
                  router.push(`/wissen/${article.category}`);
                }}
                className="w-full py-3 rounded-xl font-semibold text-amber-200 border border-amber-700 hover:bg-amber-900/30 transition-all"
              >
                Zur Kategorie
              </button>

              <button
                onClick={() => {
                  hapticTap();
                  router.push('/wissen');
                }}
                className="w-full py-3 rounded-xl font-semibold text-amber-200/70 hover:text-amber-200 transition-all"
              >
                Zur Uebersicht
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Badge Unlock Animation */}
      {newBadge && <BadgeUnlockAnimation badge={newBadge} />}
    </main>
  );
}
