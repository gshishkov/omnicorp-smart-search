import { Injectable } from '@nestjs/common';
import { Chunk } from '../documents/documents.types';
import { GroundedAnswer } from '../llm/llm-provider';

export interface ValidatedCitations {
  /** Chunks that were both cited and retrieved for this request, in citation order. */
  validChunks: Chunk[];
  /** Ids the model produced that are not in the retrieved set (hallucinated or out of scope). */
  invalidIds: string[];
  /** Answer text with invalid inline [chunk-id] markers removed. */
  answer: string;
}

export const CITATION_MARKER = /\[([a-z0-9][a-z0-9-]*#\d+)\]/g;

/**
 * Validates model-produced chunk ids against the chunks retrieved for THIS request.
 * Ids outside that set are never trusted, even if they exist elsewhere in the index.
 */
@Injectable()
export class CitationValidator {
  validate(llm: GroundedAnswer, retrieved: Chunk[]): ValidatedCitations {
    const allowed = new Map(retrieved.map((c) => [c.chunkId, c]));
    const inlineIds = [...llm.answer.matchAll(CITATION_MARKER)].map((m) => m[1]);
    const candidates = [...new Set([...llm.citedChunkIds.map((id) => id.trim()), ...inlineIds])];

    const validChunks: Chunk[] = [];
    const invalidIds: string[] = [];
    for (const id of candidates) {
      const chunk = allowed.get(id);
      if (chunk) validChunks.push(chunk);
      else invalidIds.push(id);
    }

    const answer = llm.answer
      .replace(CITATION_MARKER, (marker, id: string) => (allowed.has(id) ? marker : ''))
      .replace(/[ \t]+([.,;:!?])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return { validChunks, invalidIds, answer };
  }
}
