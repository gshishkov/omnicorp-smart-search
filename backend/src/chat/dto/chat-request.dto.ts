import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export const QUESTION_MIN_LENGTH = 3;
export const QUESTION_MAX_LENGTH = 1000;

export class ChatRequestDto {
  @ApiProperty({ example: 'What is the first response time for Premium support?', minLength: 3, maxLength: 1000 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  // class-validator runs the decorator closest to the property first; with stopAtFirstError,
  // type is checked before emptiness and length.
  @MaxLength(QUESTION_MAX_LENGTH, { message: `question must be at most ${QUESTION_MAX_LENGTH} characters` })
  @MinLength(QUESTION_MIN_LENGTH, { message: `question must be at least ${QUESTION_MIN_LENGTH} characters` })
  @IsNotEmpty({ message: 'question must not be empty' })
  @IsString({ message: 'question must be a string' })
  question!: string;
}
