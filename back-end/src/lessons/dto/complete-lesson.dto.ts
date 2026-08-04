// src/lessons/dto/complete-lesson.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsIn,
  Max,
  MaxLength,
  Min,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { ErrorSummaryDto } from '../../errors/dto/error-summary.dto';
import { TypingTelemetryDto } from '../../practice/dto/save-practice.dto';
import { SUPPORTED_INTERFACE_LOCALES } from '../../practice/dto/save-practice.dto';

export class CompleteLessonDto {
  @IsOptional()
  @IsUUID()
  clientSessionId?: string;

  @IsOptional()
  @IsIn(SUPPORTED_INTERFACE_LOCALES)
  locale?: string;

  @IsString()
  @MaxLength(64)
  @IsOptional()
  layoutId?: string;
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  netWpm?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  grossWpm?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  accuracy?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  timeElapsed?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  targetKeyErrors?: number;

  @IsBoolean()
  @IsOptional()
  usedAssistance?: boolean;

  @IsArray()
  @ArrayMaxSize(10_000)
  @IsObject({ each: true })
  @IsOptional()
  physicalEvents?: Record<string, unknown>[];

  @ValidateNested()
  @Type(() => ErrorSummaryDto)
  @IsOptional()
  errorSummary?: ErrorSummaryDto;

  @ValidateNested()
  @Type(() => TypingTelemetryDto)
  @IsOptional()
  telemetry?: TypingTelemetryDto;
}
