import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { ChunkerService } from './chunker.service';
import { DocumentLoaderService } from './document-loader.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [EmbeddingsModule, VectorStoreModule],
  controllers: [DocumentsController],
  providers: [DocumentLoaderService, ChunkerService, DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
