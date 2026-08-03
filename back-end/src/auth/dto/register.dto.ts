// src/auth/dto/register.dto.ts
import { Equals, IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos una letra y un número',
  })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  username!: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(4096)
  turnstileToken?: string;

  @IsBoolean()
  @Equals(true)
  termsAccepted!: boolean;

  @IsBoolean()
  @Equals(true)
  privacyAccepted!: boolean;
}
