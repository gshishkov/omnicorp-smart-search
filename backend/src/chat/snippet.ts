/**
 * Builds the citation `textSnippet`: plain text (no Markdown), centred on the sentence of the chunk
 * that best matches what the answer said with that citation, so the cited fact is visible.
 */

export const SNIPPET_MAX_LENGTH = 300;

const STOPWORDS = new Set(
  'the and for are but not you your with this that from have has had was were will can may must per its into than then they them their there what when where which who how does did any all also only been being our out about after before over under more most such other some each very just'.split(
    ' ',
  ),
);

/** Remove Markdown syntax from a single line, keeping its readable text. */
export function stripMarkdownLine(line: string): string {
  return line
    .replace(/^\s*#{1,6}\s+/, '') // headings
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '') // list markers
    .replace(/^\s*>\s?/, '') // blockquotes
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/, '') // table separator rows
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links / images
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
    .replace(/(?<![\w*])[*_](?!\s)(.+?)(?<!\s)[*_](?![\w*])/g, '$1') // italics
    .replace(/`([^`]*)`/g, '$1') // inline code
    .replace(/\s*\|\s*/g, ' | ') // table cells
    .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const BLOCK_START = /^\s*(?:[-*+]\s|\d+[.)]\s|\||>)/;
const HEADING_LINE = /^\s*#{1,6}\s/;

/** Re-join hard-wrapped prose; list items, table rows and quotes each start a new unit. Headings are dropped. */
function toUnits(text: string): string[] {
  const units: string[] = [];
  let joinable = false;
  for (const line of text.split('\n')) {
    if (!line.trim()) {
      joinable = false;
    } else if (HEADING_LINE.test(line)) {
      joinable = false;
    } else if (BLOCK_START.test(line) || !joinable || !units.length) {
      units.push(line);
      joinable = !/^\s*\|/.test(line);
    } else {
      units[units.length - 1] += ` ${line.trim()}`;
    }
  }
  return units;
}

/** Split chunk text into plain-text sentences (wrapped prose re-joined, Markdown removed). */
export function toSentences(text: string): string[] {
  return toUnits(text)
    .map(stripMarkdownLine)
    .filter(Boolean)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+(?:[.,][0-9]+)*/g) ?? []).filter(
    (t) => (t.length > 2 || /\d/.test(t)) && !STOPWORDS.has(t),
  );
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * @param chunkText raw chunk text (may contain Markdown)
 * @param focus text describing what was cited (answer sentences + question); used to pick the window
 */
export function buildSnippet(chunkText: string, focus: string, max = SNIPPET_MAX_LENGTH): string {
  const sentences = toSentences(chunkText);
  if (!sentences.length) return '';
  const whole = sentences.join(' ');
  if (whole.length <= max) return whole;

  const focusTokens = new Set(tokens(focus));
  // Match density: shared terms (numbers count double) divided by sqrt(sentence terms),
  // so a short sentence stating the fact beats a long one that merely mentions the topic.
  const scores = sentences.map((s) => {
    const ts = tokens(s);
    const hits = ts.reduce((sum, t) => sum + (focusTokens.has(t) ? (/\d/.test(t) ? 2 : 1) : 0), 0);
    return ts.length ? hits / Math.sqrt(ts.length) : 0;
  });
  let best = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;

  // Grow the window one sentence at a time toward the better-matching neighbour (ties: forward).
  let start = best;
  let end = best;
  let length = sentences[best].length;
  for (;;) {
    const fitsNext = end + 1 < sentences.length && length + 1 + sentences[end + 1].length <= max;
    const fitsPrev = start > 0 && length + 1 + sentences[start - 1].length <= max;
    if (!fitsNext && !fitsPrev) break;
    const takePrev = fitsPrev && (!fitsNext || scores[start - 1] > scores[end + 1]);
    if (takePrev) length += 1 + sentences[--start].length;
    else length += 1 + sentences[++end].length;
  }

  const body = truncateAtWord(sentences.slice(start, end + 1).join(' '), max);
  const prefix = start > 0 ? '… ' : '';
  const suffix = end < sentences.length - 1 && !body.endsWith('…') ? ' …' : '';
  return `${prefix}${body}${suffix}`;
}

/** Answer sentences that carry the given citation marker; falls back to the whole answer. */
export function citedSentences(answer: string, chunkId: string): string {
  const marker = `[${chunkId}]`;
  const parts = answer.split(/(?<=[.!?\]])\s+|\n+/).filter((s) => s.includes(marker));
  return parts.length ? parts.join(' ') : answer;
}
