import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { AdminMetaPermissions } from '../../decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { AdminPermissionGuard } from '../../guards/admin-permission.guard';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { TechnologyService } from './technology.service';
import {
  AddTechnologyDto,
  FilterAndPaginationTechnologyDto,
  OptionTechnologyDto,
  UpdateTechnologyDto,
} from '../../dto/technology.dto';

@Controller('technology')
export class TechnologyController {
  private logger = new Logger(TechnologyController.name);

  constructor(private technologyService: TechnologyService) {}

  /**
   * addTechnology
   * insertManyTechnology
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addTechnology(
    @Body()
    addTechnologyDto: AddTechnologyDto,
  ): Promise<ResponsePayload> {
    return await this.technologyService.addTechnology(addTechnologyDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyTechnology(
    @Body()
    body: {
      data: AddTechnologyDto[];
      option: OptionTechnologyDto;
    },
  ): Promise<ResponsePayload> {
    return await this.technologyService.insertManyTechnology(
      body.data,
      body.option,
    );
  }

  /**
   * getAllTechnologys
   * getTechnologyById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllTechnologys(
    @Body() filterTechnologyDto: FilterAndPaginationTechnologyDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.technologyService.getAllTechnologys(
      filterTechnologyDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getTechnologyById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.technologyService.getTechnologyById(id, select);
  }

  /**
   * updateTechnologyById
   * updateMultipleTechnologyById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateTechnologyById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateTechnologyDto: UpdateTechnologyDto,
  ): Promise<ResponsePayload> {
    return await this.technologyService.updateTechnologyById(
      id,
      updateTechnologyDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleTechnologyById(
    @Body() updateTechnologyDto: UpdateTechnologyDto,
  ): Promise<ResponsePayload> {
    return await this.technologyService.updateMultipleTechnologyById(
      updateTechnologyDto.ids,
      updateTechnologyDto,
    );
  }

  /**
   * deleteTechnologyById
   * deleteMultipleTechnologyById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteTechnologyById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.technologyService.deleteTechnologyById(
      id,
      Boolean(checkUsage),
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleTechnologyById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.technologyService.deleteMultipleTechnologyById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
