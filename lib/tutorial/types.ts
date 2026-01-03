// Tutorial-System Typen für Schafkopf

import { Karte, Farbe, Spielart } from '../schafkopf/types';

// Lektions-Kategorien
export type LessonCategory =
  | 'basics'      // Grundlagen
  | 'trump'       // Trumpf-System
  | 'gameflow'    // Spielablauf
  | 'gametypes'   // Spielarten
  | 'scoring'     // Wertung
  | 'tactics';    // Taktik

// Lektions-Abschnitt-Typen
export type LessonSectionType =
  | 'text'           // Markdown-Text
  | 'card-grid'      // Karten-Raster (z.B. alle Asse zeigen)
  | 'hand-example'   // Beispiel-Hand
  | 'trump-order'    // Trumpf-Reihenfolge Visualisierung
  | 'interactive';   // Interaktives Element

// Ein Abschnitt einer Lektion
export interface LessonSection {
  type: LessonSectionType;
  content?: string;           // Für text-Typ: Markdown-Inhalt
  cards?: string[];           // Für card-grid: Karten-IDs (z.B. "eichel-ober")
  caption?: string;           // Bildunterschrift
  spielart?: Spielart;        // Für trump-order: welche Spielart
  highlight?: string[];       // Hervorgehobene Karten
}

// Quiz-Frage-Typen
export type QuizType =
  | 'multiple-choice'   // Mehrfachauswahl
  | 'card-select'       // Karte auswählen
  | 'true-false'        // Richtig/Falsch
  | 'order-cards';      // Karten sortieren

// Eine Quiz-Frage
export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: string[];           // Für multiple-choice
  cards?: string[];             // Für card-select: verfügbare Karten
  correctAnswer: string | string[];
  explanation: string;          // Erklärung nach Antwort
}

// Eine komplette Lektion
export interface Lesson {
  id: string;
  title: string;
  titleBavarian?: string;       // Optionaler bayerischer Titel
  description: string;
  category: LessonCategory;
  order: number;                // Reihenfolge in Kategorie
  estimatedMinutes: number;
  requiredLessons: string[];    // Voraussetzungen
  content: LessonSection[];
  quiz: QuizQuestion[];
}

// Fortschritt einer einzelnen Lektion
export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  quizScore: number;            // 0-100
  completedAt?: number;         // Timestamp
  attempts: number;
}

// Gesamter Tutorial-Fortschritt eines Users
export interface UserTutorialState {
  lessonProgress: Record<string, LessonProgress>;
  unlockedLessons: string[];
  currentLesson?: string;
  totalProgress: number;        // Gesamtfortschritt 0-100
  practiceGamesPlayed: number;
  practiceGamesWithHints: number;
}

// Standard-Anfangszustand
export const DEFAULT_TUTORIAL_STATE: UserTutorialState = {
  lessonProgress: {},
  unlockedLessons: ['basics-kartenspiel'], // Erste Lektion immer freigeschaltet
  totalProgress: 0,
  practiceGamesPlayed: 0,
  practiceGamesWithHints: 0,
};

// Regelwerk-Abschnitt
export interface RulebookSection {
  id: string;
  title: string;
  icon: string;                 // Emoji
  keywords: string[];           // Für Suche
  content: string;              // Markdown
  relatedSections: string[];
  examples?: {
    type: 'card-grid' | 'trump-order';
    cards?: string[];
    spielart?: Spielart;
    caption?: string;
  }[];
}

// Hint für Übungsmodus
export interface PracticeHint {
  type: 'optimal-play' | 'rule-reminder' | 'tactic';
  message: string;
  suggestedCard?: Karte;
  reasons: string[];
  situation: string;            // z.B. "Du spielst aus"
}

// Optimal-Play Analyse Ergebnis
export interface OptimalPlayResult {
  optimalCard: Karte;
  score: number;
  reasons: string[];
  situation: string;
  allOptions: {
    card: Karte;
    score: number;
    reasons: string[];
  }[];
}
