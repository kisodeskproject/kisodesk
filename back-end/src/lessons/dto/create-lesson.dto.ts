// src/lessons/dto/create-lesson.dto.ts
import { LessonType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateLessonDto {
  @IsInt()
  @Min(1)
  order!: number;

  @IsEnum(LessonType)
  @IsOptional()
  type?: LessonType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  objective?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsObject()
  @IsOptional()
  fingerPositions?: Record<string, string[]>;

  @IsString({ each: true })
  @IsOptional()
  targetKeys?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  focusKeys?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  reviewKeys?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedCharacters?: string[];

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  difficulty?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedSeconds?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  minAccuracy?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxTargetKeyErrors?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  requiredSuccessfulAttempts?: number;

  @IsBoolean()
  @IsOptional()
  hideLiveWpm?: boolean;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  audioUrl?: string;
}
