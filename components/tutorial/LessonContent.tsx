'use client';

import React from 'react';
import { LessonSection } from '@/lib/tutorial/types';
import Card from '@/components/Card';
import { Farbe, Wert, Spielart } from '@/lib/schafkopf/types';

interface LessonContentProps {
  sections: LessonSection[];
}

// Trumpf-Reihenfolge für verschiedene Spielarten
const TRUMP_ORDERS: Record<string, string[]> = {
  sauspiel: [
    'eichel-ober',
    'gras-ober',
    'herz-ober',
    'schellen-ober',
    'eichel-unter',
    'gras-unter',
    'herz-unter',
    'schellen-unter',
    'herz-ass',
    'herz-10',
    'herz-koenig',
    'herz-9',
  ],
  wenz: ['eichel-unter', 'gras-unter', 'herz-unter', 'schellen-unter'],
  geier: ['eichel-ober', 'gras-ober', 'herz-ober', 'schellen-ober'],
};

function parseCardId(cardId: string): { id: string; farbe: Farbe; wert: Wert } {
  const [farbe, wert] = cardId.split('-');
  // Konvertiere "koenig" zu "koenig", "ass" zu "ass", etc.
  return {
    id: cardId,
    farbe: farbe as Farbe,
    wert: wert as Wert,
  };
}

function CardGrid({
  cards,
  caption,
  highlight,
}: {
  cards: string[];
  caption?: string;
  highlight?: string[];
}) {
  return (
    <div className="my-4">
      <div className="flex flex-wrap justify-center gap-2">
        {cards.map(cardId => {
          const karte = parseCardId(cardId);
          const isHighlighted = highlight?.includes(cardId);
          return (
            <div
              key={cardId}
              className={`transition-all ${isHighlighted ? 'ring-2 ring-amber-400 rounded-lg' : ''}`}
            >
              <Card karte={karte} size="sm" />
            </div>
          );
        })}
      </div>
      {caption && (
        <p className="text-center text-amber-100/60 text-sm mt-2 italic">{caption}</p>
      )}
    </div>
  );
}

function TrumpOrder({ spielart, caption }: { spielart: Spielart; caption?: string }) {
  // Vereinfache Spielart für Lookup
  let lookupKey = 'sauspiel';
  if (spielart === 'wenz') lookupKey = 'wenz';
  else if (spielart === 'geier') lookupKey = 'geier';

  const cards = TRUMP_ORDERS[lookupKey] || TRUMP_ORDERS.sauspiel;

  return (
    <div className="my-4 p-4 rounded-lg bg-amber-900/20 border border-amber-800/30">
      <h4 className="text-amber-300 font-semibold mb-3 text-center">
        Trumpf-Reihenfolge
      </h4>
      <div className="flex flex-wrap justify-center gap-1">
        {cards.map((cardId, index) => {
          const karte = parseCardId(cardId);
          return (
            <div key={cardId} className="relative">
              <Card karte={karte} size="sm" />
              <span className="absolute -bottom-1 -right-1 bg-amber-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>
      {caption && (
        <p className="text-center text-amber-100/60 text-sm mt-3 italic">{caption}</p>
      )}
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Einfache Markdown-Konvertierung
  const lines = content.trim().split('\n');
  const elements: React.ReactElement[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  lines.forEach((line, index) => {
    // Überschriften
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="text-xl font-bold text-amber-400 mt-4 mb-2">
          {line.slice(2)}
        </h2>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="text-lg font-semibold text-amber-300 mt-4 mb-2">
          {line.slice(3)}
        </h3>
      );
      return;
    }

    // Tabellen
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Parse Zeile
      const cells = line
        .split('|')
        .filter(c => c.trim())
        .map(c => c.trim());
      // Ignoriere Trennzeilen (---)
      if (!cells[0]?.startsWith('-')) {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      // Tabelle beenden
      inTable = false;
      elements.push(
        <table
          key={`table-${index}`}
          className="w-full my-3 text-sm border-collapse"
        >
          <thead>
            <tr>
              {tableRows[0]?.map((cell, i) => (
                <th
                  key={i}
                  className="text-left p-2 text-amber-300 border-b border-amber-800/50"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="p-2 text-amber-100/80 border-b border-amber-900/30"
                  >
                    {formatInlineMarkdown(cell)}
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
        <li key={index} className="text-amber-100/80 ml-4 list-disc">
          {formatInlineMarkdown(line.slice(2))}
        </li>
      );
      return;
    }

    // Leere Zeilen
    if (line.trim() === '') {
      return;
    }

    // Normaler Text
    elements.push(
      <p key={index} className="text-amber-100/80 my-2">
        {formatInlineMarkdown(line)}
      </p>
    );
  });

  // Falls Tabelle am Ende
  if (inTable && tableRows.length > 0) {
    elements.push(
      <table key="table-end" className="w-full my-3 text-sm border-collapse">
        <thead>
          <tr>
            {tableRows[0]?.map((cell, i) => (
              <th
                key={i}
                className="text-left p-2 text-amber-300 border-b border-amber-800/50"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="p-2 text-amber-100/80 border-b border-amber-900/30"
                >
                  {formatInlineMarkdown(cell)}
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

function formatInlineMarkdown(text: string): React.ReactNode {
  // Bold
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

export default function LessonContent({ sections }: LessonContentProps) {
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        switch (section.type) {
          case 'text':
            return (
              <div key={index}>
                <MarkdownContent content={section.content || ''} />
              </div>
            );

          case 'card-grid':
            return (
              <CardGrid
                key={index}
                cards={section.cards || []}
                caption={section.caption}
                highlight={section.highlight}
              />
            );

          case 'trump-order':
            return (
              <TrumpOrder
                key={index}
                spielart={section.spielart || 'sauspiel'}
                caption={section.caption}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
