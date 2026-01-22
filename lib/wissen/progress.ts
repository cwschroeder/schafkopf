// Wissen-Fortschritt Speicherung

import {
  UserWissenState,
  DEFAULT_WISSEN_STATE,
  ArticleProgress,
  WissenBadge,
} from './types';

const STORAGE_KEY = 'schafkopf-wissen-progress';

// Fortschritt aus localStorage laden
export function loadWissenProgress(): UserWissenState {
  if (typeof window === 'undefined') {
    return DEFAULT_WISSEN_STATE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserWissenState;
      return {
        ...DEFAULT_WISSEN_STATE,
        ...parsed,
        articleProgress: parsed.articleProgress || {},
      };
    }
  } catch (e) {
    console.error('Fehler beim Laden des Wissen-Fortschritts:', e);
  }

  return DEFAULT_WISSEN_STATE;
}

// Fortschritt in localStorage speichern
export function saveWissenProgress(state: UserWissenState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Fehler beim Speichern des Wissen-Fortschritts:', e);
  }
}

// Artikel-Quiz abschliessen
export function completeArticleQuiz(
  state: UserWissenState,
  articleId: string,
  quizScore: number,
  totalArticles: number,
  checkBadgesFn?: (state: UserWissenState) => WissenBadge[]
): { newState: UserWissenState; newBadges: WissenBadge[] } {
  const today = new Date().toISOString().split('T')[0];
  const isNewDay = state.lastReadDate !== today;
  const isConsecutiveDay = isConsecutiveDays(state.lastReadDate, today);

  const newProgress: ArticleProgress = {
    articleId,
    read: true,
    quizCompleted: quizScore >= 70,
    quizScore,
    completedAt: Date.now(),
    attempts: (state.articleProgress[articleId]?.attempts || 0) + 1,
  };

  // Neuen State erstellen
  const updatedArticleProgress = {
    ...state.articleProgress,
    [articleId]: newProgress,
  };

  // Gesamtfortschritt berechnen
  const completedCount = Object.values(updatedArticleProgress).filter(
    (p) => p.quizCompleted
  ).length;
  const totalProgress = Math.round((completedCount / totalArticles) * 100);

  const updatedState: UserWissenState = {
    ...state,
    articleProgress: updatedArticleProgress,
    totalProgress,
    lastReadDate: today,
    readStreak: isNewDay
      ? isConsecutiveDay
        ? state.readStreak + 1
        : 1
      : state.readStreak,
  };

  // Badges pruefen wenn Funktion uebergeben wurde
  let newBadges: WissenBadge[] = [];
  if (checkBadgesFn) {
    const allNewBadges = checkBadgesFn(updatedState);
    newBadges = allNewBadges.filter(
      (badge) => !state.earnedBadges.includes(badge.id)
    );
    updatedState.earnedBadges = [
      ...new Set([...state.earnedBadges, ...allNewBadges.map((b) => b.id)]),
    ];
  }

  saveWissenProgress(updatedState);
  return { newState: updatedState, newBadges };
}

// Artikel als gelesen markieren (ohne Quiz)
export function markArticleRead(
  state: UserWissenState,
  articleId: string
): UserWissenState {
  const existingProgress = state.articleProgress[articleId];

  if (existingProgress?.read) {
    return state; // Bereits gelesen
  }

  const today = new Date().toISOString().split('T')[0];
  const isNewDay = state.lastReadDate !== today;
  const isConsecutiveDay = isConsecutiveDays(state.lastReadDate, today);

  const updatedState: UserWissenState = {
    ...state,
    articleProgress: {
      ...state.articleProgress,
      [articleId]: {
        articleId,
        read: true,
        quizCompleted: existingProgress?.quizCompleted || false,
        quizScore: existingProgress?.quizScore || 0,
        attempts: existingProgress?.attempts || 0,
      },
    },
    lastReadDate: today,
    readStreak: isNewDay
      ? isConsecutiveDay
        ? state.readStreak + 1
        : 1
      : state.readStreak,
  };

  saveWissenProgress(updatedState);
  return updatedState;
}

// Hilfsfunktion: Pruefen ob aufeinanderfolgende Tage
function isConsecutiveDays(
  lastDate: string | undefined,
  today: string
): boolean {
  if (!lastDate) return false;

  const last = new Date(lastDate);
  const current = new Date(today);
  const diffTime = current.getTime() - last.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays === 1;
}

// Fortschritt zuruecksetzen
export function resetWissenProgress(): UserWissenState {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_WISSEN_STATE;
}

// Kategorie-Fortschritt berechnen
export function getCategoryProgress(
  state: UserWissenState,
  articleIds: string[]
): { completed: number; total: number; percent: number } {
  const total = articleIds.length;
  const completed = articleIds.filter(
    (id) => state.articleProgress[id]?.quizCompleted
  ).length;

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
