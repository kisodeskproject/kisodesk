import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { LanguageCode } from '@prisma/client';
import { SUPPORTED_INTERFACE_LOCALES } from './save-practice.dto';

export class GuestAdaptiveProfileDto {
  @IsEnum(LanguageCode) language!: LanguageCode;
  @IsIn(SUPPORTED_INTERFACE_LOCALES) locale!: string;
  @IsString() layoutId!: string;
  @IsInt() @Min(0) @Max(50) sampleSessions!: number;
  @IsInt() @Min(0) @Max(1_000_000) totalInputs!: number;
  @IsInt() @Min(0) @Max(1_000_000) totalFinalInputs!: number;
  @IsInt() @Min(0) @Max(1_000_000) correctFinalInputs!: number;
  @IsInt() @Min(0) @Max(1_000_000) totalIncorrectAttempts!: number;
  @IsInt() @Min(0) @Max(1_000_000) correctedErrors!: number;
  @IsInt() @Min(0) @Max(1_000_000) uncorrectedErrors!: number;
  @IsInt() @Min(0) @Max(100_000_000) totalActiveDurationMs!: number;
  @Min(0) @Max(100) finalAccuracy!: number;
  @IsObject() keyStats!: Record<string, unknown>;
  @IsObject() bigramStats!: Record<string, unknown>;
}

export class GetGuestAdaptiveExerciseDto {
  @ValidateNested() @Type(() => GuestAdaptiveProfileDto) profile!: GuestAdaptiveProfileDto;
  @IsOptional() @IsIn(['words', 'text']) mode?: 'words' | 'text';
}
