// src/users/dto/create-user.dto.ts
import { LanguageCode, LayoutCode, Role } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(LanguageCode)
  @IsOptional()
  interfaceLanguage?: LanguageCode;

  @IsEnum(LayoutCode)
  @IsOptional()
  layout?: LayoutCode;

  @IsObject()
  @IsOptional()
  accessibility?: Record<string, unknown>;
}
