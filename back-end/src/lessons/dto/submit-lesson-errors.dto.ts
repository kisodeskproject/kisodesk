// src/lessons/dto/submit-lesson-errors.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class LessonKeystrokeDto {
  @IsString()
  @MaxLength(16)
  key!: string;

  @IsInt()
  position!: number;

  @IsBoolean()
  correct!: boolean;

  @IsString()
  @MaxLength(16)
  expected!: string;
}

export class SubmitLessonErrorsDto {
  @IsInt()
  @Min(0)
  netWpm!: number;

  @IsInt()
  @Min(0)
  grossWpm!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  accuracy!: number;

  @IsInt()
  @Min(1)
  timeElapsed!: number;

  @IsArray()
  @ArrayMaxSize(10_000)
  @ValidateNested({ each: true })
  @Type(() => LessonKeystrokeDto)
  keystrokes!: LessonKeystrokeDto[];
}
