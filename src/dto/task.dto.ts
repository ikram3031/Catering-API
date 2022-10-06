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

export class AddTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class FilterTaskDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  visibility: boolean;

  @IsOptional()
  assignDate: any;

  @IsOptional()
  @IsString()
  project: string;

}

export class OptionTaskDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateTaskDto {
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

export class FilterAndPaginationTaskDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterTaskDto)
  filter: FilterTaskDto;

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

export class AddTaskListDto {
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


  @IsOptional()
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  note: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}
