// Tutorial-Fortschritt Speicherung

import { UserTutorialState, DEFAULT_TUTORIAL_STATE, LessonProgress } from './types';
import { LESSONS, canUnlockLesson } from './lessons';

const STORAGE_KEY = 'schafkopf-tutorial-progress';

// Fortschritt aus localStorage laden
export function loadTutorialProgress(): UserTutorialState {
  if (typeof window === 'undefined') {
    return DEFAULT_TUTORIAL_STATE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserTutorialState;
      // Stelle sicher, dass die Struktur korrekt ist
      return {
        ...DEFAULT_TUTORIAL_STATE,
        ...parsed,
        lessonProgress: parsed.lessonProgress || {},
        unlockedLessons: updateUnlockedLessons(parsed),
      };
    }
  } catch (e) {
    console.error('Fehler beim Laden des Tutorial-Fortschritts:', e);
  }

  return DEFAULT_TUTORIAL_STATE;
}

// Fortschritt in localStorage speichern
export function saveTutorialProgress(state: UserTutorialState): void {
  if (typeof window === 'undefined') return;

  try {
    // Aktualisiere die freigeschalteten Lektionen und Gesamtfortschritt
    const updatedState = {
      ...state,
      unlockedLessons: updateUnlockedLessons(state),
      totalProgress: calculateTotalProgress(state),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
  } catch (e) {
    console.error('Fehler beim Speichern des Tutorial-Fortschritts:', e);
  }
}

// Lektion als abgeschlossen markieren
export function completeLesson(
  state: UserTutorialState,
  lessonId: string,
  quizScore: number
): UserTutorialState {
  const newProgress: LessonProgress = {
    lessonId,
    completed: quizScore >= 70, // 70% zum Bestehen
    quizScore,
    completedAt: Date.now(),
    attempts: (state.lessonProgress[lessonId]?.attempts || 0) + 1,
  };

  const updatedState: UserTutorialState = {
    ...state,
    lessonProgress: {
      ...state.lessonProgress,
      [lessonId]: newProgress,
    },
  };

  // Aktualisiere freigeschaltete Lektionen
  updatedState.unlockedLessons = updateUnlockedLessons(updatedState);
  updatedState.totalProgress = calculateTotalProgress(updatedState);

  saveTutorialProgress(updatedState);
  return updatedState;
}

// Berechne welche Lektionen freigeschaltet sind
function updateUnlockedLessons(state: UserTutorialState): string[] {
  const completedLessons = Object.entries(state.lessonProgress)
    .filter(([, progress]) => progress.completed)
    .map(([id]) => id);

  const unlocked = new Set<string>(['basics-kartenspiel']); // Erste immer frei

  // Füge bereits freigeschaltete hinzu
  state.unlockedLessons?.forEach(id => unlocked.add(id));

  // Prüfe alle Lektionen auf neue Freischaltungen
  LESSONS.forEach(lesson => {
    if (canUnlockLesson(lesson.id, completedLessons)) {
      unlocked.add(lesson.id);
    }
  });

  return Array.from(unlocked);
}

// Berechne Gesamtfortschritt in Prozent
function calculateTotalProgress(state: UserTutorialState): number {
  const totalLessons = LESSONS.length;
  const completedLessons = Object.values(state.lessonProgress).filter(p => p.completed).length;
  return Math.round((completedLessons / totalLessons) * 100);
}

// Fortschritt zurücksetzen
export function resetTutorialProgress(): UserTutorialState {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_TUTORIAL_STATE;
}

// Übungsspiel registrieren
export function recordPracticeGame(state: UserTutorialState, withHints: boolean): UserTutorialState {
  const updatedState: UserTutorialState = {
    ...state,
    practiceGamesPlayed: state.practiceGamesPlayed + 1,
    practiceGamesWithHints: withHints
      ? state.practiceGamesWithHints + 1
      : state.practiceGamesWithHints,
  };

  saveTutorialProgress(updatedState);
  return updatedState;
}
