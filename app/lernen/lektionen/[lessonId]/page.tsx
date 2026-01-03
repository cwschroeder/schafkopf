'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { hapticTap, hapticSuccess } from '@/lib/haptics';
import { getLessonById, getNextUnlockableLessons } from '@/lib/tutorial/lessons';
import { loadTutorialProgress, completeLesson } from '@/lib/tutorial/progress';
import { UserTutorialState } from '@/lib/tutorial/types';
import LessonContent from '@/components/tutorial/LessonContent';
import QuizQuestion from '@/components/tutorial/QuizQuestion';

type Phase = 'content' | 'quiz' | 'result';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const lesson = getLessonById(lessonId);

  const [progress, setProgress] = useState<UserTutorialState | null>(null);
  const [phase, setPhase] = useState<Phase>('content');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    setProgress(loadTutorialProgress());
  }, []);

  if (!lesson) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl text-amber-400 mb-4">Lektion nicht gefunden</h1>
          <Link href="/lernen/lektionen" className="text-amber-300 underline">
            Zurück zur Übersicht
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
      setCorrectAnswers(prev => prev + 1);
    }

    // Nächste Frage oder Ergebnis
    if (currentQuestionIndex < lesson.quiz.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 500);
    } else {
      // Quiz beendet
      setTimeout(() => {
        const score = Math.round(
          ((correctAnswers + (correct ? 1 : 0)) / lesson.quiz.length) * 100
        );

        // Fortschritt speichern
        if (progress) {
          const newProgress = completeLesson(progress, lessonId, score);
          setProgress(newProgress);
        }

        if (score >= 70) {
          hapticSuccess();
        }
        setPhase('result');
      }, 1500);
    }
  };

  const quizScore = lesson.quiz.length > 0
    ? Math.round((correctAnswers / lesson.quiz.length) * 100)
    : 100;

  const passed = quizScore >= 70;
  const nextLessons = progress ? getNextUnlockableLessons(
    Object.entries(progress.lessonProgress)
      .filter(([, p]) => p.completed)
      .map(([id]) => id)
      .concat(passed ? [lessonId] : [])
  ) : [];

  return (
    <main className="min-h-screen p-4 safe-area-top safe-area-bottom">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="pt-4 mb-6">
          <Link
            href="/lernen/lektionen"
            className="text-amber-400 text-sm hover:text-amber-300"
            onClick={() => hapticTap()}
          >
            &larr; Alle Lektionen
          </Link>
          <h1 className="text-2xl font-bold text-amber-400 mt-2">{lesson.title}</h1>
          {lesson.titleBavarian && (
            <p className="text-amber-100/60 italic">{lesson.titleBavarian}</p>
          )}
        </div>

        {/* Content Phase */}
        {phase === 'content' && (
          <div className="space-y-6">
            <LessonContent sections={lesson.content} />

            {/* Zum Quiz Button */}
            {lesson.quiz.length > 0 && (
              <div className="pt-6 border-t border-amber-800/30">
                <button
                  onClick={handleStartQuiz}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: 'white',
                  }}
                >
                  Quiz starten ({lesson.quiz.length} Fragen)
                </button>
              </div>
            )}

            {/* Kein Quiz */}
            {lesson.quiz.length === 0 && (
              <div className="pt-6 border-t border-amber-800/30">
                <button
                  onClick={() => {
                    if (progress) {
                      completeLesson(progress, lessonId, 100);
                    }
                    hapticSuccess();
                    router.push('/lernen/lektionen');
                  }}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                  }}
                >
                  Lektion abschließen ✓
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quiz Phase */}
        {phase === 'quiz' && lesson.quiz[currentQuestionIndex] && (
          <div
            className="rounded-xl p-5"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '1px solid rgba(139,90,43,0.5)',
            }}
          >
            <QuizQuestion
              question={lesson.quiz[currentQuestionIndex]}
              onAnswer={handleQuizAnswer}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={lesson.quiz.length}
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
                Du hast {correctAnswers} von {lesson.quiz.length} Fragen richtig
                beantwortet.
              </p>
              <div className="mt-4 text-4xl font-bold text-white">{quizScore}%</div>
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
                  Lektion wiederholen
                </button>
              )}

              {passed && nextLessons.length > 0 && (
                <button
                  onClick={() => {
                    hapticTap();
                    router.push(`/lernen/lektionen/${nextLessons[0].id}`);
                  }}
                  className="w-full py-3 rounded-xl font-semibold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: 'white',
                  }}
                >
                  Nächste Lektion: {nextLessons[0].title}
                </button>
              )}

              <button
                onClick={() => {
                  hapticTap();
                  router.push('/lernen/lektionen');
                }}
                className="w-full py-3 rounded-xl font-semibold text-amber-200 border border-amber-700 hover:bg-amber-900/30 transition-all"
              >
                Zur Übersicht
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
