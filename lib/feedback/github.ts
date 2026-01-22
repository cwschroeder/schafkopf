/**
 * GitHub Integration für Feedback-System
 * - Issue erstellen
 * - Issue aktualisieren
 * - Status synchronisieren
 */

import type { FeedbackReport, FeedbackCategory } from './types';
import { generateGitHubIssueBody } from './ai-processing';

// GitHub API Base URL
const GITHUB_API = 'https://api.github.com';

// Umgebungsvariablen
function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error('GitHub Umgebungsvariablen nicht konfiguriert (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)');
  }

  return { token, owner, repo };
}

// Headers für GitHub API
function getHeaders() {
  const { token } = getGitHubConfig();
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

// Kategorie zu Label Mapping
const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'bug',
  feature: 'enhancement',
  question: 'question',
  other: 'feedback',
};

// Priorität zu Label Mapping
const PRIORITY_LABELS: Record<string, string> = {
  critical: 'priority: critical',
  high: 'priority: high',
  medium: 'priority: medium',
  low: 'priority: low',
};

/**
 * Erstellt ein GitHub Issue aus einem Feedback-Report
 */
export async function createGitHubIssue(report: FeedbackReport): Promise<{
  issueNumber: number;
  issueUrl: string;
}> {
  const { owner, repo } = getGitHubConfig();

  // Labels zusammenstellen
  const labels: string[] = [];

  // Kategorie-Label
  if (report.category) {
    labels.push(CATEGORY_LABELS[report.category] || 'feedback');
  }

  // Prioritäts-Label
  if (report.priority) {
    labels.push(PRIORITY_LABELS[report.priority] || 'priority: medium');
  }

  // KI-vorgeschlagene Labels (nur bekannte)
  if (report.suggestedLabels) {
    const knownLabels = ['ui', 'game-logic', 'audio', 'networking', 'performance', 'mobile', 'desktop'];
    report.suggestedLabels.forEach((label) => {
      if (knownLabels.includes(label.toLowerCase())) {
        labels.push(label.toLowerCase());
      }
    });
  }

  // Issue-Body generieren
  const body = generateGitHubIssueBody(report);

  // Issue erstellen
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      title: `[${report.category?.toUpperCase() || 'FEEDBACK'}] ${report.title}`,
      body,
      labels,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API Fehler: ${response.status} - ${error}`);
  }

  const issue = await response.json();

  return {
    issueNumber: issue.number,
    issueUrl: issue.html_url,
  };
}

/**
 * Aktualisiert ein bestehendes GitHub Issue
 */
export async function updateGitHubIssue(
  issueNumber: number,
  updates: {
    state?: 'open' | 'closed';
    labels?: string[];
    body?: string;
  }
): Promise<void> {
  const { owner, repo } = getGitHubConfig();

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API Fehler: ${response.status} - ${error}`);
  }
}

/**
 * Kommentar zu einem Issue hinzufügen
 */
export async function addIssueComment(
  issueNumber: number,
  comment: string
): Promise<void> {
  const { owner, repo } = getGitHubConfig();

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ body: comment }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API Fehler: ${response.status} - ${error}`);
  }
}

/**
 * Holt den Status eines GitHub Issues
 */
export async function getIssueStatus(issueNumber: number): Promise<{
  state: 'open' | 'closed';
  closedAt?: string;
  labels: string[];
  milestone?: string;
}> {
  const { owner, repo } = getGitHubConfig();

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API Fehler: ${response.status} - ${error}`);
  }

  const issue = await response.json();

  return {
    state: issue.state,
    closedAt: issue.closed_at,
    labels: issue.labels.map((l: { name: string }) => l.name),
    milestone: issue.milestone?.title,
  };
}

/**
 * Holt alle offenen Issues mit feedback-bezogenen Labels
 */
export async function getOpenFeedbackIssues(): Promise<
  Array<{
    number: number;
    title: string;
    state: 'open' | 'closed';
    labels: string[];
    createdAt: string;
    closedAt?: string;
  }>
> {
  const { owner, repo } = getGitHubConfig();

  // Suche nach Issues mit bug, enhancement, question oder feedback Label
  const labels = ['bug', 'enhancement', 'question', 'feedback'].join(',');

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues?labels=${labels}&state=all&per_page=100`,
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API Fehler: ${response.status} - ${error}`);
  }

  const issues = await response.json();

  return issues
    .filter((issue: { pull_request?: unknown }) => !issue.pull_request) // Keine PRs
    .map((issue: {
      number: number;
      title: string;
      state: string;
      labels: { name: string }[];
      created_at: string;
      closed_at?: string;
    }) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state as 'open' | 'closed',
      labels: issue.labels.map((l) => l.name),
      createdAt: issue.created_at,
      closedAt: issue.closed_at,
    }));
}

/**
 * Prüft ob ein Label existiert, erstellt es wenn nicht
 */
export async function ensureLabelExists(
  label: string,
  color: string = 'd73a4a',
  description?: string
): Promise<void> {
  const { owner, repo } = getGitHubConfig();

  // Prüfen ob Label existiert
  const checkResponse = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/labels/${encodeURIComponent(label)}`,
    {
      headers: getHeaders(),
    }
  );

  if (checkResponse.status === 404) {
    // Label erstellen
    const createResponse = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/labels`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: label,
          color,
          description,
        }),
      }
    );

    if (!createResponse.ok && createResponse.status !== 422) {
      // 422 = Label existiert bereits (Race Condition)
      const error = await createResponse.text();
      throw new Error(`Label-Erstellung fehlgeschlagen: ${error}`);
    }
  }
}

/**
 * Initialisiert alle benötigten Labels im Repository
 */
export async function initializeLabels(): Promise<void> {
  const labels = [
    { name: 'bug', color: 'd73a4a', description: 'Something isn\'t working' },
    { name: 'enhancement', color: 'a2eeef', description: 'New feature or request' },
    { name: 'question', color: 'd876e3', description: 'Further information is requested' },
    { name: 'feedback', color: 'bfdadc', description: 'General feedback' },
    { name: 'priority: critical', color: 'b60205', description: 'Critical priority' },
    { name: 'priority: high', color: 'd93f0b', description: 'High priority' },
    { name: 'priority: medium', color: 'fbca04', description: 'Medium priority' },
    { name: 'priority: low', color: '0e8a16', description: 'Low priority' },
    { name: 'ui', color: '1d76db', description: 'UI/UX related' },
    { name: 'game-logic', color: 'c5def5', description: 'Game logic related' },
    { name: 'audio', color: 'fef2c0', description: 'Audio related' },
    { name: 'networking', color: 'e99695', description: 'Networking/Realtime related' },
    { name: 'mobile', color: 'd4c5f9', description: 'Mobile specific' },
  ];

  for (const label of labels) {
    try {
      await ensureLabelExists(label.name, label.color, label.description);
    } catch (error) {
      console.warn(`[GitHub] Label "${label.name}" konnte nicht erstellt werden:`, error);
    }
  }
}
