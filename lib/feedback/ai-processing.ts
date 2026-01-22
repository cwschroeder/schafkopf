/**
 * KI-Verarbeitung für Feedback Reports
 * - Kategorisierung
 * - Prioritäts-Einschätzung
 * - Duplikat-Erkennung
 * - Zusammenfassung
 */

import OpenAI from 'openai';
import type { FeedbackReport, FeedbackCategory, FeedbackPriority, AIProcessingResult } from './types';

// Lazy initialization - nur wenn OPENAI_API_KEY vorhanden
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Kategorisiert und analysiert einen Feedback-Report
 */
export async function analyzeReport(report: FeedbackReport): Promise<AIProcessingResult> {
  const prompt = `Du bist ein Support-Analyst für eine Schafkopf (bayerisches Kartenspiel) App.
Analysiere das folgende Nutzer-Feedback und kategorisiere es.

Titel: ${report.title}
Beschreibung: ${report.description}
Vom Nutzer gewählte Kategorie: ${report.category}

Technischer Kontext:
- App-Version: ${report.context?.appVersion || 'unbekannt'}
- URL: ${report.context?.currentUrl || 'unbekannt'}
- Gerät: ${report.context?.userAgent?.substring(0, 100) || 'unbekannt'}
${report.context?.consoleErrors?.length ? `- Fehler-Logs: ${report.context.consoleErrors.join('; ')}` : ''}
${report.context?.roomId ? `- Raum-ID: ${report.context.roomId}` : ''}

Aufgaben:
1. Bestätige oder korrigiere die Kategorie basierend auf dem Inhalt
2. Schätze die Priorität ein
3. Erstelle eine kurze technische Zusammenfassung für Entwickler

Antworte NUR mit einem JSON-Objekt:
{
  "category": "bug" | "feature" | "question" | "other",
  "priority": "critical" | "high" | "medium" | "low",
  "summary": "Kurze technische Zusammenfassung (1-2 Sätze)",
  "suggestedLabels": ["label1", "label2"] // GitHub Labels wie "ui", "game-logic", "audio", "networking", etc.
}

Prioritäts-Richtlinien:
- critical: App-Crash, Datenverlust, Spiel unspielbar
- high: Feature funktioniert nicht, aber Workaround möglich
- medium: Kleinere Bugs, UI-Probleme
- low: Kosmetische Issues, Nice-to-have Features`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Keine Antwort von OpenAI');
    }

    const result = JSON.parse(content);

    return {
      category: validateCategory(result.category) || report.category || 'other',
      priority: validatePriority(result.priority) || 'medium',
      summary: result.summary || report.title,
      suggestedLabels: Array.isArray(result.suggestedLabels) ? result.suggestedLabels : [],
    };
  } catch (error) {
    console.error('[Feedback AI] Analyse-Fehler:', error);
    // Fallback: Nutzer-Eingaben übernehmen
    return {
      category: report.category || 'other',
      priority: 'medium',
      summary: report.title,
      suggestedLabels: [],
    };
  }
}

/**
 * Prüft auf Duplikate unter bestehenden Reports
 */
export async function checkForDuplicates(
  report: FeedbackReport,
  existingReports: FeedbackReport[]
): Promise<{ isDuplicate: boolean; duplicateOf?: string; similarity?: number }> {
  // Keine Duplikate wenn weniger als 2 Reports
  if (existingReports.length === 0) {
    return { isDuplicate: false };
  }

  // Nur offene Reports berücksichtigen
  const openReports = existingReports.filter(
    (r) => r.id !== report.id && !['resolved', 'closed', 'notified'].includes(r.status)
  );

  if (openReports.length === 0) {
    return { isDuplicate: false };
  }

  // Nur die relevantesten Reports (gleiche Kategorie, neueste zuerst)
  const relevantReports = openReports
    .filter((r) => r.category === report.category)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  if (relevantReports.length === 0) {
    return { isDuplicate: false };
  }

  const existingList = relevantReports
    .map((r, i) => `${i + 1}. [${r.id}] ${r.title}: ${r.description.substring(0, 100)}...`)
    .join('\n');

  const prompt = `Prüfe ob das neue Feedback ein Duplikat eines bestehenden Reports ist.

NEUES FEEDBACK:
Titel: ${report.title}
Beschreibung: ${report.description}

BESTEHENDE REPORTS:
${existingList}

Ist das neue Feedback ein Duplikat? Antworte NUR mit JSON:
{
  "isDuplicate": true | false,
  "duplicateIndex": 1-${relevantReports.length} oder null,
  "similarity": 0-100,
  "reason": "Kurze Begründung"
}

Hinweis: Nur als Duplikat markieren wenn es dasselbe Problem beschreibt (similarity > 70).`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 150,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { isDuplicate: false };
    }

    const result = JSON.parse(content);

    if (result.isDuplicate && result.duplicateIndex && result.similarity > 70) {
      const duplicateReport = relevantReports[result.duplicateIndex - 1];
      return {
        isDuplicate: true,
        duplicateOf: duplicateReport?.id,
        similarity: result.similarity,
      };
    }

    return { isDuplicate: false, similarity: result.similarity };
  } catch (error) {
    console.error('[Feedback AI] Duplikat-Check Fehler:', error);
    return { isDuplicate: false };
  }
}

/**
 * Generiert einen GitHub Issue Body aus dem Report
 */
export function generateGitHubIssueBody(report: FeedbackReport): string {
  const lines: string[] = [];

  // Beschreibung
  lines.push('## Beschreibung');
  lines.push(report.description);
  lines.push('');

  // AI-Zusammenfassung
  if (report.aiSummary) {
    lines.push('## KI-Zusammenfassung');
    lines.push(`> ${report.aiSummary}`);
    lines.push('');
  }

  // Kontext
  lines.push('## Technischer Kontext');
  lines.push('| Info | Wert |');
  lines.push('|------|------|');
  lines.push(`| Report-ID | \`${report.id}\` |`);
  lines.push(`| App-Version | ${report.context?.appVersion || '-'} |`);
  lines.push(`| Bildschirm | ${report.context?.screenSize || '-'} |`);
  if (report.context?.roomId) {
    lines.push(`| Raum-ID | \`${report.context.roomId}\` |`);
  }
  if (report.context?.gameId) {
    lines.push(`| Spiel-ID | \`${report.context.gameId}\` |`);
  }
  lines.push(`| Browser | ${report.context?.userAgent?.substring(0, 80) || '-'} |`);
  lines.push('');

  // Console-Fehler
  if (report.context?.consoleErrors && report.context.consoleErrors.length > 0) {
    lines.push('## Fehler-Logs');
    lines.push('```');
    report.context.consoleErrors.slice(0, 5).forEach((err) => {
      lines.push(err);
    });
    lines.push('```');
    lines.push('');
  }

  // Screenshots
  if (report.screenshots && report.screenshots.length > 0) {
    lines.push('## Screenshots');
    report.screenshots.forEach((ss, i) => {
      lines.push(`![Screenshot ${i + 1}](/feedback/${ss.filename})`);
    });
    lines.push('');
  }

  // Duplikat-Hinweis
  if (report.duplicateOf) {
    lines.push(`> ⚠️ Mögliches Duplikat von: ${report.duplicateOf}`);
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Gemeldet von: ${report.userName} (${report.userId})*`);
  lines.push(`*Eingereicht: ${new Date(report.createdAt).toLocaleString('de-DE')}*`);

  return lines.join('\n');
}

/**
 * Validiert die Kategorie
 */
function validateCategory(value: string): FeedbackCategory | null {
  const valid: FeedbackCategory[] = ['bug', 'feature', 'question', 'other'];
  return valid.includes(value as FeedbackCategory) ? (value as FeedbackCategory) : null;
}

/**
 * Validiert die Priorität
 */
function validatePriority(value: string): FeedbackPriority | null {
  const valid: FeedbackPriority[] = ['critical', 'high', 'medium', 'low'];
  return valid.includes(value as FeedbackPriority) ? (value as FeedbackPriority) : null;
}

/**
 * Verarbeitet einen Report vollständig (Analyse + Duplikat-Check)
 */
export async function processReport(
  report: FeedbackReport,
  existingReports: FeedbackReport[]
): Promise<{
  analysis: AIProcessingResult;
  duplicateCheck: { isDuplicate: boolean; duplicateOf?: string; similarity?: number };
}> {
  // Parallel ausführen für Performance
  const [analysis, duplicateCheck] = await Promise.all([
    analyzeReport(report),
    checkForDuplicates(report, existingReports),
  ]);

  return { analysis, duplicateCheck };
}
