import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';
import { BazarItem } from '../interfaces/common/bazaar.interface';

export class AddBazaarDto {
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @IsNotEmpty()
  @IsArray()
  @IsObject({ each: true })
  items: BazarItem[];

  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;
}

export class FilterBazaarDto {
  @IsOptional()
  @IsString()
  name: string;
}

export class OptionBazaarDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateBazaarDto {
  @IsOptional()
  @IsDateString()
  date: Date;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  items: BazarItem[];

  @IsOptional()
  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationBazaarDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterBazaarDto)
  filter: FilterBazaarDto;

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
