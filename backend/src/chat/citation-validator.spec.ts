import { Chunk } from '../documents/documents.types';
import { CitationValidator } from './citation-validator';

const chunk = (id: string): Chunk => ({
  chunkId: id,
  sourceId: id.split('#')[0],
  documentTitle: 'Doc',
  headingPath: [],
  index: 0,
  text: 'text',
});

describe('CitationValidator', () => {
  const validator = new CitationValidator();
  const retrieved = [chunk('billing#1'), chunk('sla#0')];

  it('keeps only ids from the retrieved set and reports the rest', () => {
    const result = validator.validate(
      { answerable: true, answer: 'A [billing#1].', citedChunkIds: ['billing#1', 'billing#7', 'ghost#0'] },
      retrieved,
    );
    expect(result.validChunks.map((c) => c.chunkId)).toEqual(['billing#1']);
    expect(result.invalidIds).toEqual(['billing#7', 'ghost#0']);
  });

  it('strips invalid inline markers but keeps valid ones', () => {
    const result = validator.validate(
      { answerable: true, answer: 'Fact one [sla#0]. Fact two [made-up#3].', citedChunkIds: ['sla#0'] },
      retrieved,
    );
    expect(result.answer).toBe('Fact one [sla#0]. Fact two.');
    expect(result.invalidIds).toEqual(['made-up#3']);
  });

  it('accepts valid inline markers missing from citedChunkIds and dedupes', () => {
    const result = validator.validate(
      { answerable: true, answer: 'X [sla#0] and [billing#1] [sla#0].', citedChunkIds: ['billing#1'] },
      retrieved,
    );
    expect(result.validChunks.map((c) => c.chunkId)).toEqual(['billing#1', 'sla#0']);
  });

  it('returns no valid chunks when every id is hallucinated', () => {
    const result = validator.validate({ answerable: true, answer: 'Y', citedChunkIds: ['nope#1'] }, retrieved);
    expect(result.validChunks).toEqual([]);
  });
});
