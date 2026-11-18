import { Injectable } from '@nestjs/common';
import { Chunk, SourceDocument } from './documents.types';

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
}

interface Section {
  headingPath: string[];
  body: string;
}

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

/** Split markdown into sections at headings, tracking the heading hierarchy. Ignores `#` inside code fences. */
export function splitIntoSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const stack: { level: number; text: string }[] = [];
  let body: string[] = [];
  let inFence = false;

  const flush = () => {
    const text = body.join('\n').trim();
    if (text) sections.push({ headingPath: stack.map((h) => h.text), body: text });
    body = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = inFence ? null : HEADING.exec(line);
    if (m) {
      flush();
      const level = m[1].length;
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack.push({ level, text: m[2] });
    } else {
      body.push(line);
    }
  }
  flush();
  return sections;
}

function splitLongUnit(unit: string, size: number): string[] {
  if (unit.length <= size) return [unit];
  const sentences = unit.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (s.length > size) {
      if (current) out.push(current);
      current = '';
      for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
    } else if (!current) {
      current = s;
    } else if (current.length + 1 + s.length <= size) {
      current += ' ' + s;
    } else {
      out.push(current);
      current = s;
    }
  }
  if (current) out.push(current);
  return out;
}

function overlapTail(text: string, overlap: number): string {
  if (overlap <= 0 || text.length <= overlap) return '';
  const tail = text.slice(-overlap);
  const firstSpace = tail.indexOf(' ');
  return (firstSpace >= 0 ? tail.slice(firstSpace + 1) : tail).trim();
}

/** Greedily pack paragraphs into pieces of at most ~chunkSize chars, carrying an overlap tail forward. */
export function packText(text: string, { chunkSize, chunkOverlap }: ChunkOptions): string[] {
  const units = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => splitLongUnit(p, chunkSize));

  const pieces: string[] = [];
  let current = '';
  for (const unit of units) {
    if (!current) {
      current = unit;
    } else if (current.length + 2 + unit.length <= chunkSize) {
      current += '\n\n' + unit;
    } else {
      pieces.push(current);
      const tail = overlapTail(current, chunkOverlap);
      current = tail ? `${tail}\n\n${unit}` : unit;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

@Injectable()
export class ChunkerService {
  chunk(doc: SourceDocument, options: ChunkOptions): Chunk[] {
    const chunks: Chunk[] = [];
    for (const section of splitIntoSections(doc.content)) {
      // The H1 usually repeats the document title; drop it from the path to keep context short.
      const headingPath =
        section.headingPath[0] === doc.title ? section.headingPath.slice(1) : section.headingPath;
      for (const text of packText(section.body, options)) {
        const index = chunks.length;
        chunks.push({
          chunkId: `${doc.sourceId}#${index}`,
          sourceId: doc.sourceId,
          documentTitle: doc.title,
          headingPath,
          index,
          text,
        });
      }
    }
    return chunks;
  }
}

/** Text sent to the embedding model: title + section path give the vector document context. */
export function embeddingInput(chunk: Chunk): string {
  const path = [chunk.documentTitle, ...chunk.headingPath].join(' > ');
  return `${path}\n\n${chunk.text}`;
}
