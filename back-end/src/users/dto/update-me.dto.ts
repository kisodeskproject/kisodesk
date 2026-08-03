// src/users/dto/update-me.dto.ts
import { LanguageCode, LayoutCode } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsIn,
  ValidateIf,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { COUNTRY_CODES } from '../../common/country-codes';

export class UpdateMeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(72)
  @IsOptional()
  password?: string;

  @IsEnum(LanguageCode)
  @IsOptional()
  interfaceLanguage?: LanguageCode;

  @IsEnum(LayoutCode)
  @IsOptional()
  layout?: LayoutCode;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @ValidateIf((_object, value) => value !== null)
  @IsIn(COUNTRY_CODES)
  @IsOptional()
  countryCode?: string | null;

  @IsObject()
  @IsOptional()
  accessibility?: Record<string, unknown>;

  @IsString()
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/)
  @IsOptional()
  publicAlias?: string | null;

  @IsBoolean()
  @IsOptional()
  showInRanking?: boolean;

  @IsBoolean()
  @IsOptional()
  searchableByAlias?: boolean;

  @IsBoolean()
  @IsOptional()
  showPresenceToFriends?: boolean;

  @IsBoolean()
  @IsOptional()
  shareStatsWithFriends?: boolean;

  @IsBoolean()
  @IsOptional()
  allowFriendRequests?: boolean;

  @IsDateString()
  @IsOptional()
  updatedAt?: string;
}
