import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

export class AddMenuDto {
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  items: string[];

  @IsNotEmpty()
  @IsString()
  type: string;
}

export class FilterMenuDto {
  @IsOptional()
  @IsString()
  name: string;
}

export class OptionMenuDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateMenuDto {
  @IsOptional()
  @IsDateString()
  date: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items: string[];

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationMenuDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterMenuDto)
  filter: FilterMenuDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  sort: object;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  select: any;
}
