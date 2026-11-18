import { Chunk } from '../documents/documents.types';

export interface GroundedAnswerRequest {
  question: string;
  chunks: Chunk[];
}

export interface GroundedAnswer {
  answerable: boolean;
  answer: string;
  citedChunkIds: string[];
}

/** Chat-model abstraction (DI token). Implementations must answer only from `chunks`. */
export abstract class LlmProvider {
  abstract readonly modelName: string;
  abstract generateGroundedAnswer(request: GroundedAnswerRequest): Promise<GroundedAnswer>;
}
