import { ApiProperty } from '@nestjs/swagger';

export class CitationDto {
  @ApiProperty({ example: 'sla-and-support-tiers' }) sourceId!: string;
  @ApiProperty({ example: 'SLA and Support Tiers' }) documentTitle!: string;
  @ApiProperty({ example: 'sla-and-support-tiers#2' }) chunkId!: string;
  @ApiProperty({ example: 'Premium customers receive a first response within 1 business hour…' }) textSnippet!: string;
}

export class ChatResponseDto {
  @ApiProperty({ example: 'Premium support has a 1 business hour first-response target [sla-and-support-tiers#2].' })
  answer!: string;

  @ApiProperty({ type: [CitationDto] })
  citations!: CitationDto[];

  @ApiProperty({ description: 'true when the documentation does not contain an answer' })
  refused!: boolean;
}
