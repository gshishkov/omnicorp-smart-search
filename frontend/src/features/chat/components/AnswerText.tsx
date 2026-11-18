import { Fragment } from 'react';
import type { Citation } from '../../../types/api';

const MARKER_SPLIT = /(\[[a-z0-9][a-z0-9-]*#\d+\])/g;
const MARKER = /^\[([a-z0-9][a-z0-9-]*#\d+)\]$/;

interface AnswerTextProps {
  text: string;
  citations: Citation[];
  messageId: string;
}

/** Renders the answer, turning [chunk-id] markers into numbered links to the matching citation card. */
export function AnswerText({ text, citations, messageId }: AnswerTextProps) {
  const numberById = new Map(citations.map((c, i) => [c.chunkId, i + 1]));

  return (
    <p className="whitespace-pre-line leading-relaxed">
      {text.split(MARKER_SPLIT).map((part, i) => {
        const marker = MARKER.exec(part);
        if (!marker) return <Fragment key={i}>{part}</Fragment>;
        const n = numberById.get(marker[1]);
        if (!n) return null;
        return (
          <a
            key={i}
            href={`#cite-${messageId}-${n}`}
            title={citations[n - 1].documentTitle}
            className="ml-0.5 align-super text-xs font-semibold text-brand-600 hover:underline"
          >
            [{n}]
          </a>
        );
      })}
    </p>
  );
}
