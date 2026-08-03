import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DeleteMeDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @IsOptional()
  currentPassword?: string;

  @IsEmail()
  @MaxLength(254)
  confirmationEmail!: string;
}
