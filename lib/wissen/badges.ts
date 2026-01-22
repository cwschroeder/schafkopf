// Wissen Badge-System

import {
  WissenBadge,
  UserWissenState,
  WissenCategory,
  WissenArticle,
} from './types';

// Badge-Definitionen
export const WISSEN_BADGES: WissenBadge[] = [
  // Kategorie-Badges (Bronze)
  {
    id: 'historiker',
    name: 'Geschichtskenner',
    nameBavarian: "G'schichtskenner",
    description: 'Alle Geschichte-Artikel abgeschlossen',
    icon: '📜',
    tier: 'bronze',
    requirement: { type: 'category-complete', category: 'geschichte' },
  },
  {
    id: 'wirtshausexperte',
    name: 'Wirtshausexperte',
    nameBavarian: 'Wirtshausexperte',
    description: 'Alle Wirtshauskultur-Artikel abgeschlossen',
    icon: '🍺',
    tier: 'bronze',
    requirement: { type: 'category-complete', category: 'wirtshauskultur' },
  },
  {
    id: 'legendenkenner',
    name: 'Legendenkenner',
    nameBavarian: 'Legendnkenner',
    description: 'Alle Spieler-Artikel abgeschlossen',
    icon: '🏆',
    tier: 'bronze',
    requirement: { type: 'category-complete', category: 'spieler' },
  },
  {
    id: 'sprachmeister',
    name: 'Sprachmeister',
    nameBavarian: 'Sprachmoasta',
    description: 'Alle Sprache-Artikel abgeschlossen',
    icon: '💬',
    tier: 'bronze',
    requirement: { type: 'category-complete', category: 'sprache' },
  },

  // Master-Badge (Gold)
  {
    id: 'schafkopf-gelehrter',
    name: 'Schafkopf-Gelehrter',
    nameBavarian: "Schafkopf-G'lehrter",
    description: 'Alle Wissen-Artikel abgeschlossen',
    icon: '🎓',
    tier: 'gold',
    requirement: { type: 'all-complete' },
  },

  // Quiz-Meister (Silber)
  {
    id: 'quizmeister',
    name: 'Quizmeister',
    nameBavarian: 'Quizmoasta',
    description: '5 Quizze mit 100% bestanden',
    icon: '✨',
    tier: 'silver',
    requirement: { type: 'quiz-perfect', count: 5 },
  },

  // Streak-Badge (Silber)
  {
    id: 'wissbegierig',
    name: 'Wissbegierig',
    nameBavarian: 'Wissbegirig',
    description: '7 Tage in Folge gelesen',
    icon: '🔥',
    tier: 'silver',
    requirement: { type: 'read-streak', days: 7 },
  },
];

// Pruefe ob ein Badge freigeschaltet wurde
export function checkBadgeUnlock(
  badge: WissenBadge,
  state: UserWissenState,
  articles: WissenArticle[]
): boolean {
  const { requirement } = badge;

  switch (requirement.type) {
    case 'category-complete': {
      const categoryArticles = articles.filter(
        (a) => a.category === requirement.category
      );
      return categoryArticles.every(
        (a) => state.articleProgress[a.id]?.quizCompleted
      );
    }

    case 'all-complete': {
      return articles.every((a) => state.articleProgress[a.id]?.quizCompleted);
    }

    case 'quiz-perfect': {
      const perfectQuizzes = Object.values(state.articleProgress).filter(
        (p) => p.quizScore === 100
      );
      return perfectQuizzes.length >= requirement.count;
    }

    case 'read-streak': {
      return state.readStreak >= requirement.days;
    }

    default:
      return false;
  }
}

// Alle freigeschalteten Badges ermitteln
export function getUnlockedBadges(
  state: UserWissenState,
  articles: WissenArticle[]
): WissenBadge[] {
  return WISSEN_BADGES.filter((badge) =>
    checkBadgeUnlock(badge, state, articles)
  );
}

// Neu freigeschaltete Badges ermitteln (fuer Animationen)
export function getNewlyUnlockedBadges(
  oldState: UserWissenState,
  newState: UserWissenState,
  articles: WissenArticle[]
): WissenBadge[] {
  return WISSEN_BADGES.filter(
    (badge) =>
      !oldState.earnedBadges.includes(badge.id) &&
      checkBadgeUnlock(badge, newState, articles)
  );
}

// Badge nach ID finden
export function getBadgeById(id: string): WissenBadge | undefined {
  return WISSEN_BADGES.find((b) => b.id === id);
}

// Badge-Tier Farben
export function getBadgeTierColor(tier: WissenBadge['tier']): string {
  switch (tier) {
    case 'bronze':
      return '#cd7f32';
    case 'silver':
      return '#c0c0c0';
    case 'gold':
      return '#ffd700';
    default:
      return '#888888';
  }
}

// Badge-Tier Hintergrund-Gradient
export function getBadgeTierGradient(tier: WissenBadge['tier']): string {
  switch (tier) {
    case 'bronze':
      return 'linear-gradient(135deg, #cd7f32 0%, #8b4513 100%)';
    case 'silver':
      return 'linear-gradient(135deg, #e8e8e8 0%, #a0a0a0 100%)';
    case 'gold':
      return 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)';
    default:
      return 'linear-gradient(135deg, #888888 0%, #555555 100%)';
  }
}
