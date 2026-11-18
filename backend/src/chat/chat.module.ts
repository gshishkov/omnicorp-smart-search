import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { LlmModule } from '../llm/llm.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CitationValidator } from './citation-validator';

@Module({
  imports: [EmbeddingsModule, LlmModule, VectorStoreModule],
  controllers: [ChatController],
  providers: [ChatService, CitationValidator],
})
export class ChatModule {}
