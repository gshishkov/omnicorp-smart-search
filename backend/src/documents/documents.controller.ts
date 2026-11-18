import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentMetadataDto, ReloadResultDto } from './dto/document-response.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List loaded knowledge-base documents' })
  @ApiOkResponse({ type: [DocumentMetadataDto] })
  list(): DocumentMetadataDto[] {
    return this.documents.list();
  }

  @Post('reload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-read the source folder, re-chunk and re-embed all documents' })
  @ApiOkResponse({ type: ReloadResultDto })
  reload(): Promise<ReloadResultDto> {
    return this.documents.reload();
  }
}
