'use client';

import React from 'react';
import { ArticleSection, TimelineEvent } from '@/lib/wissen/types';

interface ArticleContentProps {
  sections: ArticleSection[];
}

// Markdown-Text rendern
function MarkdownContent({ content }: { content: string }) {
  const lines = content.trim().split('\n');
  const elements: React.ReactElement[] = [];

  lines.forEach((line, index) => {
    // Ueberschriften
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
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={index} className="text-base font-semibold text-amber-200 mt-3 mb-1">
          {line.slice(4)}
        </h4>
      );
      return;
    }

    // Nummerierte Listen
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <li key={index} className="text-amber-100/80 ml-6 list-decimal">
          {formatInlineMarkdown(numberedMatch[2])}
        </li>
      );
      return;
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

// Zeitleiste rendern
function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="my-4 relative">
      {/* Vertikale Linie */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-amber-700/50" />

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="relative pl-10">
            {/* Punkt auf der Linie */}
            <div className="absolute left-2.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-amber-300" />

            {/* Jahr */}
            <div className="text-amber-400 font-bold text-sm">{event.year}</div>

            {/* Event */}
            <div className="text-amber-200 font-semibold">{event.event}</div>

            {/* Beschreibung */}
            {event.description && (
              <div className="text-amber-100/70 text-sm">{event.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Zitat rendern
function Quote({
  text,
  bavarian,
  source,
}: {
  text: string;
  bavarian?: string;
  source?: string;
}) {
  return (
    <blockquote
      className="my-4 p-4 rounded-lg border-l-4 border-amber-500"
      style={{
        background: 'linear-gradient(135deg, rgba(217,119,6,0.1) 0%, rgba(180,83,9,0.1) 100%)',
      }}
    >
      <div className="text-amber-100 italic text-lg">"{text}"</div>
      {bavarian && (
        <div className="text-amber-300/80 italic text-sm mt-2">
          Bayerisch: "{bavarian}"
        </div>
      )}
      {source && (
        <div className="text-amber-100/60 text-sm mt-2">— {source}</div>
      )}
    </blockquote>
  );
}

// Fun-Fact Box rendern
function FunFact({ content }: { content: string }) {
  return (
    <div
      className="my-4 p-4 rounded-lg border border-amber-500/50"
      style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.1) 100%)',
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div>
          <div className="text-amber-400 font-semibold text-sm mb-1">
            Wusstest du?
          </div>
          <div className="text-amber-100/90">{content}</div>
        </div>
      </div>
    </div>
  );
}

// Glossar-Eintrag rendern
function GlossaryTerm({
  term,
  definition,
  example,
}: {
  term: string;
  definition: string;
  example?: string;
}) {
  return (
    <div
      className="my-3 p-3 rounded-lg"
      style={{
        background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
        border: '1px solid rgba(139,90,43,0.5)',
      }}
    >
      <div className="text-amber-400 font-bold">{term}</div>
      <div className="text-amber-100/80 text-sm mt-1">{definition}</div>
      {example && (
        <div className="text-amber-300/70 text-sm mt-2 italic">
          Beispiel: "{example}"
        </div>
      )}
    </div>
  );
}

// Bild rendern (falls vorhanden)
function ImageSection({
  src,
  alt,
  caption,
}: {
  src: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <figure className="my-4">
      <div
        className="rounded-lg overflow-hidden bg-amber-900/20 flex items-center justify-center p-4"
        style={{ minHeight: '120px' }}
      >
        {/* Placeholder wenn kein Bild vorhanden */}
        <div className="text-amber-100/50 text-center">
          <div className="text-4xl mb-2">🖼️</div>
          <div className="text-sm">{alt || 'Bild folgt'}</div>
        </div>
      </div>
      {caption && (
        <figcaption className="text-center text-amber-100/60 text-sm mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function ArticleContent({ sections }: ArticleContentProps) {
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

          case 'timeline':
            return (
              <Timeline key={index} events={section.timelineEvents || []} />
            );

          case 'quote':
            return (
              <Quote
                key={index}
                text={section.quoteText || ''}
                bavarian={section.quoteBavarian}
                source={section.quoteSource}
              />
            );

          case 'fun-fact':
            return <FunFact key={index} content={section.content || ''} />;

          case 'glossary-term':
            return (
              <GlossaryTerm
                key={index}
                term={section.term || ''}
                definition={section.definition || ''}
                example={section.example}
              />
            );

          case 'image':
            return (
              <ImageSection
                key={index}
                src={section.imageSrc || ''}
                alt={section.imageAlt}
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
