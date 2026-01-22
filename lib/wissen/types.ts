// Wissen-System Typen fuer Schafkopf

// Artikel-Kategorien
export type WissenCategory =
  | 'geschichte'      // Geschichte & Ursprung
  | 'wirtshauskultur' // Wirtshauskultur
  | 'spieler'         // Beruehmte Spieler
  | 'sprache';        // Sprache & Begriffe

// Abschnitt-Typen (erweitert gegenueber Tutorial)
export type ArticleSectionType =
  | 'text'           // Markdown-Text
  | 'image'          // Bild mit Unterschrift
  | 'quote'          // Zitat (bayerisch/deutsch)
  | 'timeline'       // Zeitleiste
  | 'glossary-term'  // Glossar-Eintrag
  | 'fun-fact';      // Wusstest du...? Box

// Zeitleisten-Event
export interface TimelineEvent {
  year: string;
  event: string;
  description?: string;
}

// Ein Abschnitt eines Artikels
export interface ArticleSection {
  type: ArticleSectionType;
  content?: string;           // Fuer text-Typ: Markdown-Inhalt
  imageSrc?: string;          // Fuer image-Typ: Bildpfad
  imageAlt?: string;          // Alt-Text
  caption?: string;           // Bildunterschrift oder Zitat-Quelle
  quoteText?: string;         // Zitat-Text (Hochdeutsch)
  quoteBavarian?: string;     // Bayerische Version
  quoteSource?: string;       // Quelle/Person
  term?: string;              // Fuer glossary-term
  definition?: string;        // Definition
  example?: string;           // Beispielsatz
  timelineEvents?: TimelineEvent[];
}

// Quiz-Frage-Typen
export type WissenQuizType =
  | 'multiple-choice'
  | 'true-false'
  | 'match-pairs';     // Zuordnung (Begriff -> Definition)

// Eine Quiz-Frage
export interface WissenQuizQuestion {
  id: string;
  type: WissenQuizType;
  question: string;
  options?: string[];
  pairs?: { left: string; right: string }[];  // Fuer match-pairs
  correctAnswer: string | string[];
  explanation: string;
  explanationBavarian?: string;  // Optionale bayerische Erklaerung
}

// Ein kompletter Wissen-Artikel
export interface WissenArticle {
  id: string;
  title: string;
  titleBavarian?: string;
  description: string;
  category: WissenCategory;
  order: number;
  estimatedMinutes: number;
  tags: string[];              // Fuer Suche/Filter
  content: ArticleSection[];
  quiz: WissenQuizQuestion[];
  badgeReward?: string;        // Badge-ID bei Abschluss
}

// Fortschritt eines einzelnen Artikels
export interface ArticleProgress {
  articleId: string;
  read: boolean;              // Artikel gelesen
  quizCompleted: boolean;     // Quiz absolviert
  quizScore: number;          // 0-100
  completedAt?: number;       // Timestamp
  attempts: number;
}

// Gesamter Wissen-Fortschritt eines Users
export interface UserWissenState {
  articleProgress: Record<string, ArticleProgress>;
  totalProgress: number;      // Gesamtfortschritt 0-100
  earnedBadges: string[];     // Badge-IDs
  readStreak: number;         // Tage in Folge gelesen
  lastReadDate?: string;      // YYYY-MM-DD
}

// Badge Requirement Typen
export type BadgeRequirement =
  | { type: 'category-complete'; category: WissenCategory }
  | { type: 'all-complete' }
  | { type: 'quiz-perfect'; count: number }
  | { type: 'read-streak'; days: number };

// Badge Definition
export interface WissenBadge {
  id: string;
  name: string;
  nameBavarian?: string;
  description: string;
  icon: string;               // Emoji
  tier: 'bronze' | 'silver' | 'gold';
  requirement: BadgeRequirement;
}

// Standard-Anfangszustand
export const DEFAULT_WISSEN_STATE: UserWissenState = {
  articleProgress: {},
  totalProgress: 0,
  earnedBadges: [],
  readStreak: 0,
};

// Kategorien mit Metadaten
export const WISSEN_CATEGORIES: {
  id: WissenCategory;
  title: string;
  titleBavarian: string;
  icon: string;
  description: string;
}[] = [
  {
    id: 'geschichte',
    title: 'Geschichte & Ursprung',
    titleBavarian: "G'schicht & Herkunft",
    icon: '📜',
    description: 'Von den Anfaengen bis heute',
  },
  {
    id: 'wirtshauskultur',
    title: 'Wirtshauskultur',
    titleBavarian: 'Wirtshaus-Kultur',
    icon: '🍺',
    description: 'Tradition und Braeuche am Stammtisch',
  },
  {
    id: 'spieler',
    title: 'Beruehmte Spieler',
    titleBavarian: 'Beriehmte Spuier',
    icon: '🏆',
    description: 'Legenden und Liebhaber des Spiels',
  },
  {
    id: 'sprache',
    title: 'Sprache & Begriffe',
    titleBavarian: 'Sproch & Begriffe',
    icon: '💬',
    description: 'Das Schafkopf-Vokabular erklaert',
  },
];
