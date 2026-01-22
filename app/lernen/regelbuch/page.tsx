'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { hapticTap } from '@/lib/haptics';
import { RULEBOOK_SECTIONS, searchRulebook, getRulebookSection } from '@/lib/tutorial/rulebook';
import { RulebookSection } from '@/lib/tutorial/types';
import LessonContent from '@/components/tutorial/LessonContent';

export default function RegelbuchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const filteredSections = searchRulebook(searchQuery);

  const handleToggleSection = (sectionId: string) => {
    hapticTap();
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <main className="min-h-screen p-4 safe-area-top safe-area-bottom">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="pt-4">
          <Link
            href="/lernen"
            className="text-amber-400 text-sm hover:text-amber-300"
            onClick={() => hapticTap()}
          >
            &larr; Zurück
          </Link>
          <h1 className="text-2xl font-bold text-amber-400 mt-2">Regelbuch</h1>
          <p className="text-amber-100/60 text-sm mt-1">
            Alle Regeln zum Nachschlagen
          </p>
        </div>

        {/* Suche */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Suchen... (z.B. Trumpf, Schneider)"
            className="w-full px-4 py-3 rounded-xl bg-amber-950/50 border border-amber-800/50 text-amber-100 placeholder-amber-100/40 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Ergebnisse */}
        {searchQuery && (
          <p className="text-amber-100/60 text-sm">
            {filteredSections.length} Ergebnis{filteredSections.length !== 1 ? 'se' : ''}
          </p>
        )}

        {/* Sections */}
        <div className="space-y-3">
          {filteredSections.map(section => (
            <SectionAccordion
              key={section.id}
              section={section}
              isExpanded={expandedSection === section.id}
              onToggle={() => handleToggleSection(section.id)}
            />
          ))}
        </div>

        {/* Keine Ergebnisse */}
        {filteredSections.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <p className="text-amber-100/60">Keine Ergebnisse für &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-amber-400 underline"
            >
              Suche löschen
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function SectionAccordion({
  section,
  isExpanded,
  onToggle,
}: {
  section: RulebookSection;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
        border: '1px solid rgba(139,90,43,0.5)',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-amber-900/20 transition-colors"
      >
        <span className="text-2xl">{section.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-200">{section.title}</h3>
          {!isExpanded && (
            <p className="text-amber-100/50 text-sm line-clamp-1">
              {section.keywords.slice(0, 3).join(', ')}...
            </p>
          )}
        </div>
        <span
          className={`text-amber-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-amber-900/30">
          <div className="pt-4">
            <MarkdownRenderer content={section.content} />

            {/* Beispiele */}
            {section.examples && section.examples.length > 0 && (
              <div className="mt-4">
                <LessonContent
                  sections={section.examples.map(ex => ({
                    type: ex.type,
                    cards: ex.cards,
                    spielart: ex.spielart,
                    caption: ex.caption,
                  }))}
                />
              </div>
            )}

            {/* Verwandte Themen */}
            {section.relatedSections.length > 0 && (
              <div className="mt-4 pt-3 border-t border-amber-900/30">
                <p className="text-amber-100/50 text-xs mb-2">Siehe auch:</p>
                <div className="flex flex-wrap gap-2">
                  {section.relatedSections.map(relatedId => {
                    const related = getRulebookSection(relatedId);
                    if (!related) return null;
                    return (
                      <span
                        key={relatedId}
                        className="text-xs px-2 py-1 rounded bg-amber-900/30 text-amber-200"
                      >
                        {related.icon} {related.title}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.trim().split('\n');
  const elements: React.ReactElement[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  lines.forEach((line, index) => {
    // Überschriften
    if (line.startsWith('**') && line.endsWith('**') && !line.includes(' ')) {
      elements.push(
        <h4 key={index} className="font-semibold text-amber-300 mt-3 mb-1">
          {line.slice(2, -2)}
        </h4>
      );
      return;
    }

    // Tabellen
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line
        .split('|')
        .filter(c => c.trim())
        .map(c => c.trim());
      if (!cells[0]?.startsWith('-')) {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      inTable = false;
      elements.push(
        <table key={`table-${index}`} className="w-full my-2 text-sm">
          <thead>
            <tr>
              {tableRows[0]?.map((cell, i) => (
                <th key={i} className="text-left p-1 text-amber-300 border-b border-amber-800/50">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="p-1 text-amber-100/80">
                    {formatInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // Listen
    if (line.startsWith('- ')) {
      elements.push(
        <li key={index} className="text-amber-100/80 ml-4 list-disc text-sm">
          {formatInline(line.slice(2))}
        </li>
      );
      return;
    }

    // Leere Zeilen
    if (line.trim() === '') return;

    // Normaler Text
    elements.push(
      <p key={index} className="text-amber-100/80 text-sm my-1">
        {formatInline(line)}
      </p>
    );
  });

  // Tabelle am Ende
  if (inTable && tableRows.length > 0) {
    elements.push(
      <table key="table-end" className="w-full my-2 text-sm">
        <thead>
          <tr>
            {tableRows[0]?.map((cell, i) => (
              <th key={i} className="text-left p-1 text-amber-300 border-b border-amber-800/50">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.slice(1).map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="p-1 text-amber-100/80">
                  {formatInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <div>{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-amber-200 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
