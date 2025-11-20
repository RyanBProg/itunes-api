import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { toNumber } from '../../common/utils/toNumber';

export class GetArtistsTodayDto {
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit? = 20;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page? = 1;
}
