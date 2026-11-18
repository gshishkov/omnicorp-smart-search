import { ApiProperty } from '@nestjs/swagger';
import { DocumentMetadata, ReloadResult, ReloadStatus } from '../documents.types';

export class DocumentMetadataDto implements DocumentMetadata {
  @ApiProperty({ example: 'sla-and-support-tiers' }) sourceId!: string;
  @ApiProperty({ example: 'SLA and Support Tiers' }) title!: string;
  @ApiProperty({ example: 'sla-and-support-tiers.md' }) fileName!: string;
  @ApiProperty({ example: 9 }) chunkCount!: number;
  @ApiProperty({ example: 5120 }) sizeBytes!: number;
  @ApiProperty({ example: '2026-11-18T13:45:00.000Z' }) loadedAt!: string;
}

export class ReloadResultDto implements ReloadResult {
  @ApiProperty({ enum: ['completed', 'failed'] }) status!: ReloadStatus;
  @ApiProperty({ example: 5 }) documentsLoaded!: number;
  @ApiProperty({ example: 42 }) chunksCreated!: number;
  @ApiProperty({ example: 1830 }) durationMs!: number;
  @ApiProperty({ type: [String], example: [] }) errors!: string[];
}
