'use client';

import { useState, useEffect } from 'react';
import { QuizQuestion as QuizQuestionType } from '@/lib/tutorial/types';
import { hapticTap, hapticSuccess, hapticError } from '@/lib/haptics';
import Card from '@/components/Card';

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (correct: boolean) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuizQuestion({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // State zurücksetzen wenn eine neue Frage kommt
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
  }, [question]);

  const handleAnswer = (answer: string) => {
    if (showResult) return;

    hapticTap();
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = Array.isArray(question.correctAnswer)
      ? question.correctAnswer.includes(answer)
      : question.correctAnswer === answer;

    if (isCorrect) {
      hapticSuccess();
    } else {
      hapticError();
    }

    // Kurze Verzögerung vor dem Weiter
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 2000);
  };

  const isCorrect = (answer: string) => {
    return Array.isArray(question.correctAnswer)
      ? question.correctAnswer.includes(answer)
      : question.correctAnswer === answer;
  };

  const getButtonStyle = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option
        ? 'border-amber-400 bg-amber-900/50'
        : 'border-amber-800/50 bg-amber-950/30 hover:bg-amber-900/30';
    }

    if (isCorrect(option)) {
      return 'border-green-500 bg-green-900/50';
    }

    if (selectedAnswer === option && !isCorrect(option)) {
      return 'border-red-500 bg-red-900/50';
    }

    return 'border-gray-700 bg-gray-900/30 opacity-50';
  };

  return (
    <div className="space-y-4">
      {/* Fortschritt */}
      <div className="flex items-center justify-between text-sm text-amber-100/60">
        <span>
          Frage {questionNumber} von {totalQuestions}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < questionNumber - 1
                  ? 'bg-green-500'
                  : i === questionNumber - 1
                  ? 'bg-amber-400'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Frage */}
      <h3 className="text-lg font-semibold text-amber-200">{question.question}</h3>

      {/* Antwortoptionen */}
      {question.type === 'multiple-choice' && question.options && (
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getButtonStyle(
                option
              )}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-amber-100">{option}</span>
                {showResult && isCorrect(option) && (
                  <span className="ml-auto text-green-400">✓</span>
                )}
                {showResult && selectedAnswer === option && !isCorrect(option) && (
                  <span className="ml-auto text-red-400">✗</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* True/False */}
      {question.type === 'true-false' && (
        <div className="flex gap-3">
          <button
            onClick={() => handleAnswer('true')}
            disabled={showResult}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${getButtonStyle(
              'true'
            )}`}
          >
            <span className="text-amber-100 font-medium">Richtig</span>
          </button>
          <button
            onClick={() => handleAnswer('false')}
            disabled={showResult}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${getButtonStyle(
              'false'
            )}`}
          >
            <span className="text-amber-100 font-medium">Falsch</span>
          </button>
        </div>
      )}

      {/* Card Select */}
      {question.type === 'card-select' && question.cards && (
        <div className="flex justify-center gap-4">
          {question.cards.map(cardId => {
            const [farbe, wert] = cardId.split('-') as [string, string];
            return (
              <button
                key={cardId}
                onClick={() => handleAnswer(cardId)}
                disabled={showResult}
                className={`p-2 rounded-lg border-2 transition-all ${getButtonStyle(cardId)}`}
              >
                <Card
                  karte={{ id: cardId, farbe: farbe as any, wert: wert as any }}
                  size="md"
                  onClick={() => {}}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Erklärung */}
      {showResult && (
        <div
          className={`p-4 rounded-lg ${
            isCorrect(selectedAnswer!)
              ? 'bg-green-900/30 border border-green-700'
              : 'bg-red-900/30 border border-red-700'
          }`}
        >
          <p
            className={`font-semibold mb-1 ${
              isCorrect(selectedAnswer!) ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isCorrect(selectedAnswer!) ? '✓ Richtig!' : '✗ Leider falsch'}
          </p>
          <p className="text-gray-300 text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
