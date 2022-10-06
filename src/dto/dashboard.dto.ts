import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
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

export class AddDashboardDto {
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class FilterDashboardDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  visibility: boolean;
}

export class OptionDashboardDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateDashboardDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationDashboardDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterDashboardDto)
  filter: FilterDashboardDto;

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

export class AddDashboardListDto {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  checked: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  expectedTimeInMinute: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  actualTimeInMinute: number;
}
