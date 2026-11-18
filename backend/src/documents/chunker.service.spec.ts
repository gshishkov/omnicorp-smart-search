import { ChunkerService, embeddingInput, packText, splitIntoSections } from './chunker.service';
import { SourceDocument } from './documents.types';

const doc = (content: string): SourceDocument => ({
  sourceId: 'guide',
  title: 'Guide',
  fileName: 'guide.md',
  content,
  sizeBytes: content.length,
});

describe('splitIntoSections', () => {
  it('tracks the heading hierarchy', () => {
    const sections = splitIntoSections('# Guide\nIntro\n## Setup\nSetup text\n### SAML\nSaml text\n## Billing\nBill text');
    expect(sections.map((s) => s.headingPath)).toEqual([
      ['Guide'],
      ['Guide', 'Setup'],
      ['Guide', 'Setup', 'SAML'],
      ['Guide', 'Billing'],
    ]);
  });

  it('ignores headings inside code fences and drops empty sections', () => {
    const sections = splitIntoSections('# A\n## Empty\n## Code\n```\n# not a heading\n```');
    expect(sections).toHaveLength(1);
    expect(sections[0].headingPath).toEqual(['A', 'Code']);
    expect(sections[0].body).toContain('# not a heading');
  });
});

describe('packText', () => {
  it('keeps short text as one piece', () => {
    expect(packText('one\n\ntwo', { chunkSize: 100, chunkOverlap: 10 })).toEqual(['one\n\ntwo']);
  });

  it('splits long text, respects size, and carries overlap forward', () => {
    const para = (n: number) => `Paragraph ${n} ` + 'word '.repeat(30).trim() + '.';
    const text = [1, 2, 3, 4].map(para).join('\n\n');
    const pieces = packText(text, { chunkSize: 200, chunkOverlap: 40 });
    expect(pieces.length).toBeGreaterThan(1);
    // Each piece is at most size + overlap (the carried tail).
    for (const p of pieces) expect(p.length).toBeLessThanOrEqual(240);
    // The second piece starts with the tail of the first.
    const tail = pieces[0].slice(-20);
    expect(pieces[1]).toContain(tail.trim().split(' ').slice(-1)[0]);
  });

  it('hard-splits a single oversized sentence', () => {
    const pieces = packText('x'.repeat(450), { chunkSize: 200, chunkOverlap: 0 });
    expect(pieces).toEqual(['x'.repeat(200), 'x'.repeat(200), 'x'.repeat(50)]);
  });
});

describe('ChunkerService', () => {
  const chunker = new ChunkerService();

  it('produces deterministic sequential ids with source metadata', () => {
    const d = doc('# Guide\nIntro text.\n## Setup\nStep one.\n## FAQ\nAnswer.');
    const first = chunker.chunk(d, { chunkSize: 800, chunkOverlap: 100 });
    const second = chunker.chunk(d, { chunkSize: 800, chunkOverlap: 100 });
    expect(first).toEqual(second);
    expect(first.map((c) => c.chunkId)).toEqual(['guide#0', 'guide#1', 'guide#2']);
    expect(first.every((c) => c.sourceId === 'guide' && c.documentTitle === 'Guide')).toBe(true);
  });

  it('drops the H1 that repeats the document title from the heading path', () => {
    const [intro, setup] = chunker.chunk(doc('# Guide\nIntro.\n## Setup\nStep.'), { chunkSize: 800, chunkOverlap: 0 });
    expect(intro.headingPath).toEqual([]);
    expect(setup.headingPath).toEqual(['Setup']);
    expect(embeddingInput(setup)).toBe('Guide > Setup\n\nStep.');
  });
});
