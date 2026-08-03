import { IsEmail, IsString, MinLength, IsOptional, IsInt, IsObject } from 'class-validator';

export class CreateUsuarioDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  layout?: string;

  @IsOptional()
  @IsInt()
  goalsWpm?: number;

  @IsOptional()
  @IsInt()
  goalsAccuracy?: number;

  @IsOptional()
  @IsObject()
  accessibility?: Record<string, any>;
}
