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
import { DesignationService } from './designation.service';
import {
  AddDesignationDto,
  FilterAndPaginationDesignationDto,
  OptionDesignationDto,
  UpdateDesignationDto,
} from '../../dto/designation.dto';

@Controller('designation')
export class DesignationController {
  private logger = new Logger(DesignationController.name);

  constructor(private designationService: DesignationService) {}

  /**
   * addDesignation
   * insertManyDesignation
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addDesignation(
    @Body()
    addDesignationDto: AddDesignationDto,
  ): Promise<ResponsePayload> {
    return await this.designationService.addDesignation(addDesignationDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyDesignation(
    @Body()
    body: {
      data: AddDesignationDto[];
      option: OptionDesignationDto;
    },
  ): Promise<ResponsePayload> {
    return await this.designationService.insertManyDesignation(
      body.data,
      body.option,
    );
  }

  /**
   * getAllDesignations
   * getDesignationById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllDesignations(
    @Body() filterDesignationDto: FilterAndPaginationDesignationDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.designationService.getAllDesignations(
      filterDesignationDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getDesignationById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.designationService.getDesignationById(id, select);
  }

  /**
   * updateDesignationById
   * updateMultipleDesignationById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateDesignationById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateDesignationDto: UpdateDesignationDto,
  ): Promise<ResponsePayload> {
    return await this.designationService.updateDesignationById(
      id,
      updateDesignationDto,
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
  async updateMultipleDesignationById(
    @Body() updateDesignationDto: UpdateDesignationDto,
  ): Promise<ResponsePayload> {
    return await this.designationService.updateMultipleDesignationById(
      updateDesignationDto.ids,
      updateDesignationDto,
    );
  }

  /**
   * deleteDesignationById
   * deleteMultipleDesignationById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteDesignationById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.designationService.deleteDesignationById(
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
  async deleteMultipleDesignationById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.designationService.deleteMultipleDesignationById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
