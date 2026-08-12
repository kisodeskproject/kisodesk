import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const EVENT_TYPES = ['vital', 'navigation', 'error', 'request', 'session', 'page_view', 'analytics_session_started', 'practice_started', 'practice_completed', 'practice_abandoned'] as const;
const VITAL_NAMES = ['lcp', 'inp', 'cls'] as const;
const ERROR_CATEGORIES = ['runtime', 'promise', 'resource'] as const;
const STATUS_CLASSES = ['2xx', '3xx', '4xx', '5xx', 'network'] as const;

export class FrontendTelemetryEventDto {
  @IsIn(EVENT_TYPES)
  type!: (typeof EVENT_TYPES)[number];

  @IsString()
  @MaxLength(160)
  route!: string;

  @IsOptional()
  @IsIn(VITAL_NAMES)
  metricName?: (typeof VITAL_NAMES)[number];

  @IsOptional()
  @IsIn(ERROR_CATEGORIES)
  errorCategory?: (typeof ERROR_CATEGORIES)[number];

  @IsOptional()
  @IsIn(STATUS_CLASSES)
  statusClass?: (typeof STATUS_CLASSES)[number];

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(120)
  value?: number;

  @IsOptional()
  @IsIn(['anonymous', 'authenticated'])
  authState?: 'anonymous' | 'authenticated';

  @IsOptional()
  @IsIn(['es', 'en', 'pt', 'fr', 'cs', 'da', 'de', 'hr', 'hu', 'it', 'nl', 'no', 'pl', 'ro', 'sv', 'tr'])
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  layout?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;
}

export class FrontendTelemetryBatchDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FrontendTelemetryEventDto)
  events!: FrontendTelemetryEventDto[];
}
