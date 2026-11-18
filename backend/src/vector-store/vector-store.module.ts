import { Module } from '@nestjs/common';
import { InMemoryVectorStore } from './in-memory-vector-store';
import { VectorStore } from './vector-store';

@Module({
  providers: [{ provide: VectorStore, useClass: InMemoryVectorStore }],
  exports: [VectorStore],
})
export class VectorStoreModule {}
