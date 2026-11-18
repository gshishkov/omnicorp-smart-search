import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('chat')
@Controller('chat')
@UseGuards(ThrottlerGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask a question; the answer is grounded in the knowledge base with citations' })
  @ApiOkResponse({ type: ChatResponseDto })
  ask(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    return this.chat.ask(body.question);
  }
}
