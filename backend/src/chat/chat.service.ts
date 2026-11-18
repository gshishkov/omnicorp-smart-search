import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { Chunk } from '../documents/documents.types';
import { EmbeddingProvider } from '../embeddings/embedding-provider';
import { LlmProvider } from '../llm/llm-provider';
import { VectorStore } from '../vector-store/vector-store';
import { CitationValidator } from './citation-validator';
import { ChatResponseDto, CitationDto } from './dto/chat-response.dto';

export const REFUSAL_MESSAGE =
  "I couldn't find an answer to that in the OmniCorp documentation. Try rephrasing your question, or contact the documentation owner if the topic should be covered.";

const SNIPPET_LENGTH = 300;

export type RefusalReason = 'no_relevant_chunks' | 'model_not_answerable' | 'no_valid_citations';

export function toSnippet(text: string, max = SNIPPET_LENGTH): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly embeddings: EmbeddingProvider,
    private readonly store: VectorStore,
    private readonly llm: LlmProvider,
    private readonly citations: CitationValidator,
  ) {}

  async ask(question: string): Promise<ChatResponseDto> {
    if (this.store.size() === 0) {
      throw new ServiceUnavailableException(
        'The knowledge base is not loaded yet. Try again shortly or call POST /api/documents/reload.',
      );
    }

    const [queryVector] = await this.embeddings.embed([question]);
    const minSimilarity = this.config.get('MIN_SIMILARITY');
    const results = this.store.search(queryVector, this.config.get('TOP_K'));
    const relevant = results.filter((r) => r.score >= minSimilarity).map((r) => r.chunk);

    this.logger.debug(
      `retrieval topScore=${results[0]?.score.toFixed(3) ?? 'n/a'} relevant=${relevant.length}/${results.length}`,
    );

    // Nothing in the docs is close enough: refuse without calling the LLM.
    if (!relevant.length) return this.refuse('no_relevant_chunks');

    const llmAnswer = await this.llm.generateGroundedAnswer({ question, chunks: relevant });
    if (!llmAnswer.answerable || !llmAnswer.answer.trim()) return this.refuse('model_not_answerable');

    const { validChunks, invalidIds, answer } = this.citations.validate(llmAnswer, relevant);
    if (invalidIds.length) {
      this.logger.warn(`Dropped ${invalidIds.length} invalid citation id(s): ${invalidIds.join(', ')}`);
    }
    if (!validChunks.length || !answer) return this.refuse('no_valid_citations');

    return { answer, refused: false, citations: validChunks.map((c) => this.toCitation(c)) };
  }

  private toCitation(chunk: Chunk): CitationDto {
    // Built from the store, never from model output.
    return {
      sourceId: chunk.sourceId,
      documentTitle: chunk.documentTitle,
      chunkId: chunk.chunkId,
      textSnippet: toSnippet(chunk.text),
    };
  }

  private refuse(reason: RefusalReason): ChatResponseDto {
    this.logger.log(`Refused: ${reason}`);
    return { answer: REFUSAL_MESSAGE, citations: [], refused: true };
  }
}
