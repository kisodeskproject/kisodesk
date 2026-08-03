import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class KeyMistakeSummaryDto {
  @IsString()
  @MaxLength(16)
  typed!: string;

  @IsInt()
  @Min(1)
  count!: number;
}

export class KeyErrorSummaryDto {
  @IsString()
  @MaxLength(16)
  expected!: string;

  @IsInt()
  @Min(1)
  totalPresses!: number;

  @IsInt()
  @Min(0)
  totalErrors!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  techniqueErrors?: number;

  @IsArray()
  @ArrayMaxSize(256)
  @ValidateNested({ each: true })
  @Type(() => KeyMistakeSummaryDto)
  @IsOptional()
  mistakes?: KeyMistakeSummaryDto[];
}

export class ErrorSummaryDto {
  @IsInt()
  @Min(1)
  totalKeystrokes!: number;

  @IsInt()
  @Min(0)
  totalErrors!: number;

  @IsArray()
  @ArrayMaxSize(256)
  @ValidateNested({ each: true })
  @Type(() => KeyErrorSummaryDto)
  keys!: KeyErrorSummaryDto[];
}
