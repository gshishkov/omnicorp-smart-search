import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from '../documents/documents.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  health() {
    return { status: 'ok', knowledgeBase: this.documents.getStatus() };
  }
}
