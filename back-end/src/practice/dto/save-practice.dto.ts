// src/practice/dto/save-practice.dto.ts
import { LanguageCode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';

import { ErrorSummaryDto } from '../../errors/dto/error-summary.dto';

export const SUPPORTED_INTERFACE_LOCALES = [
  'cs',
  'da',
  'de',
  'en-US',
  'en-GB',
  'es-ES',
  'es-latam',
  'fr',
  'hr',
  'hu',
  'it',
  'nl',
  'no',
  'pl',
  'pt-BR',
  'pt-PT',
  'ro',
  'sv',
  'tr',
] as const;

class TelemetryEventDto {
  @IsInt() @Min(0) sequence!: number;
  @IsIn(['input', 'backspace', 'dead-key', 'modifier', 'control']) kind!: string;
  @IsInt() @Min(0) timestamp!: number;
  @IsString() @MaxLength(64) code!: string;
  @IsString() @MaxLength(32) key!: string;
  @IsInt() @Min(0) position!: number;
  @IsOptional() @IsString() @MaxLength(16) expected?: string;
  @IsOptional() @IsString() @MaxLength(16) typed?: string;
  @IsOptional() @IsBoolean() correct?: boolean;
  @IsOptional() @IsBoolean() composing?: boolean;
  @IsOptional() @IsBoolean() shiftKey?: boolean;
}

export class TypingTelemetryDto {
  @IsInt() @IsIn([1]) version!: number;
  @IsString() @MaxLength(20000) text!: string;
  @IsOptional() @IsInt() @Min(0) startedAt?: number | null;
  @IsInt() @Min(0) pausedMs!: number;
  @IsArray()
  @ArrayMaxSize(20000)
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventDto)
  events!: TelemetryEventDto[];
}

export class SavePracticeDto {
  @IsOptional()
  @IsIn(['direct', 'guest_sync'])
  source?: 'direct' | 'guest_sync';

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

  @IsEnum(LanguageCode)
  language!: LanguageCode;

  @IsOptional()
  @IsIn(SUPPORTED_INTERFACE_LOCALES)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  layoutId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  textId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ErrorSummaryDto)
  errorSummary?: ErrorSummaryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypingTelemetryDto)
  telemetry?: TypingTelemetryDto;

  @IsOptional()
  @IsUUID()
  clientSessionId?: string;
}
