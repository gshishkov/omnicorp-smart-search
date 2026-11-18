import { GroundedAnswer, GroundedAnswerRequest, LlmProvider } from '../../src/llm/llm-provider';

type Responder = (req: GroundedAnswerRequest) => GroundedAnswer;

/** Default: answers with the first sentence of the top chunk and cites it. Override with `respondWith`. */
export class FakeLlmProvider extends LlmProvider {
  readonly modelName = 'fake-llm';
  requests: GroundedAnswerRequest[] = [];
  private responder: Responder = (req) => {
    const top = req.chunks[0];
    const sentence = top.text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s/)[0];
    return { answerable: true, answer: `${sentence} [${top.chunkId}]`, citedChunkIds: [top.chunkId] };
  };

  respondWith(responder: Responder): void {
    this.responder = responder;
  }

  async generateGroundedAnswer(req: GroundedAnswerRequest): Promise<GroundedAnswer> {
    this.requests.push(req);
    return this.responder(req);
  }
}
