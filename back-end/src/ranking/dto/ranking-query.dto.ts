import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { SUPPORTED_INTERFACE_LOCALES } from '../../practice/dto/save-practice.dto';

const toOptionalNumber = ({ value }: { value: unknown }) =>
  value === undefined ? undefined : Number(value);

export class RankingQueryDto {
  @IsOptional()
  @IsIn(['global', ...SUPPORTED_INTERFACE_LOCALES])
  language?: string;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(0)
  offset?: number;
}
