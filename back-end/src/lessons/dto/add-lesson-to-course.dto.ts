// src/lessons/dto/add-lesson-to-course.dto.ts
import { IsInt, Min, IsOptional } from 'class-validator';

export class AddLessonToCourseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
