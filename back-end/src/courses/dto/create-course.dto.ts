// src/courses/dto/create-course.dto.ts
import { CourseLevel, LanguageCode, LayoutCode } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(LanguageCode)
  languageCode!: LanguageCode;

  @IsString()
  @IsOptional()
  localeCode?: string;

  @IsEnum(CourseLevel)
  level!: CourseLevel;

  @IsArray()
  @IsEnum(LayoutCode, { each: true })
  @IsOptional()
  supportedLayouts?: LayoutCode[];

  @IsInt()
  @Min(1)
  @IsOptional()
  curriculumVersion?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedMinutes?: number;
}
