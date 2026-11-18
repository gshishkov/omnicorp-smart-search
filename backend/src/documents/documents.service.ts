import { ConflictException, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { EmbeddingProvider } from '../embeddings/embedding-provider';
import { VectorStore } from '../vector-store/vector-store';
import { ChunkerService, embeddingInput } from './chunker.service';
import { DocumentLoaderService } from './document-loader.service';
import { Chunk, DocumentMetadata, KnowledgeBaseStatus, ReloadResult } from './documents.types';

@Injectable()
export class DocumentsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DocumentsService.name);
  private reloading = false;
  private status: KnowledgeBaseStatus = 'empty';
  private documents: DocumentMetadata[] = [];

  constructor(
    private readonly config: AppConfigService,
    private readonly loader: DocumentLoaderService,
    private readonly chunker: ChunkerService,
    private readonly embeddings: EmbeddingProvider,
    private readonly store: VectorStore,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.config.get('LOAD_DOCUMENTS_ON_STARTUP')) return;
    // Not awaited: the API starts immediately; /api/health reports progress.
    this.reload().catch((err: Error) => this.logger.error(`Initial document load failed: ${err.message}`));
  }

  async reload(): Promise<ReloadResult> {
    if (this.reloading) throw new ConflictException('A document reload is already in progress.');
    this.reloading = true;
    const previousStatus = this.status;
    this.status = 'loading';
    const started = Date.now();

    try {
      const { documents, errors } = await this.loader.loadAll(this.config.get('SOURCE_DIR'));
      if (!documents.length) {
        this.status = previousStatus === 'ready' ? 'ready' : 'failed';
        return this.result('failed', 0, 0, started, [...errors, 'No markdown documents were loaded.']);
      }

      const options = {
        chunkSize: this.config.get('CHUNK_SIZE'),
        chunkOverlap: this.config.get('CHUNK_OVERLAP'),
      };
      const perDoc = documents.map((doc) => ({ doc, chunks: this.chunker.chunk(doc, options) }));
      const allChunks: Chunk[] = perDoc.flatMap((d) => d.chunks);
      const vectors = await this.embeddings.embed(allChunks.map(embeddingInput));
      if (vectors.length !== allChunks.length) {
        throw new Error(`Embedding count mismatch: expected ${allChunks.length}, got ${vectors.length}`);
      }

      this.store.replaceAll(allChunks.map((chunk, i) => ({ ...chunk, embedding: vectors[i] })));
      const loadedAt = new Date().toISOString();
      this.documents = perDoc.map(({ doc, chunks }) => ({
        sourceId: doc.sourceId,
        title: doc.title,
        fileName: doc.fileName,
        chunkCount: chunks.length,
        sizeBytes: doc.sizeBytes,
        loadedAt,
      }));
      this.status = 'ready';
      const result = this.result('completed', documents.length, allChunks.length, started, errors);
      this.logger.log(
        `Knowledge base loaded: ${result.documentsLoaded} documents, ${result.chunksCreated} chunks in ${result.durationMs}ms (model=${this.embeddings.modelName})`,
      );
      return result;
    } catch (err) {
      // Keep serving the previous index if there was one.
      this.status = previousStatus === 'ready' ? 'ready' : 'failed';
      throw err;
    } finally {
      this.reloading = false;
    }
  }

  list(): DocumentMetadata[] {
    return [...this.documents];
  }

  getStatus(): { status: KnowledgeBaseStatus; documents: number; chunks: number } {
    return { status: this.status, documents: this.documents.length, chunks: this.store.size() };
  }

  private result(
    status: ReloadResult['status'],
    documentsLoaded: number,
    chunksCreated: number,
    started: number,
    errors: string[],
  ): ReloadResult {
    return { status, documentsLoaded, chunksCreated, durationMs: Date.now() - started, errors };
  }
}
