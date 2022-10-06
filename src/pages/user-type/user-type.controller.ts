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
import { UserTypeService } from './user-type.service';
import {
  AddUserTypeDto,
  FilterAndPaginationUserTypeDto,
  OptionUserTypeDto,
  UpdateUserTypeDto,
} from '../../dto/user-type.dto';

@Controller('user-type')
export class UserTypeController {
  private logger = new Logger(UserTypeController.name);

  constructor(private userTypeService: UserTypeService) {}

  /**
   * addUserType
   * insertManyUserType
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addUserType(
    @Body()
    addUserTypeDto: AddUserTypeDto,
  ): Promise<ResponsePayload> {
    return await this.userTypeService.addUserType(addUserTypeDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyUserType(
    @Body()
    body: {
      data: AddUserTypeDto[];
      option: OptionUserTypeDto;
    },
  ): Promise<ResponsePayload> {
    return await this.userTypeService.insertManyUserType(
      body.data,
      body.option,
    );
  }

  /**
   * getAllUserTypes
   * getUserTypeById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllUserTypes(
    @Body() filterUserTypeDto: FilterAndPaginationUserTypeDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.userTypeService.getAllUserTypes(
      filterUserTypeDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getUserTypeById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.userTypeService.getUserTypeById(id, select);
  }

  /**
   * updateUserTypeById
   * updateMultipleUserTypeById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateUserTypeById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateUserTypeDto: UpdateUserTypeDto,
  ): Promise<ResponsePayload> {
    return await this.userTypeService.updateUserTypeById(id, updateUserTypeDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleUserTypeById(
    @Body() updateUserTypeDto: UpdateUserTypeDto,
  ): Promise<ResponsePayload> {
    return await this.userTypeService.updateMultipleUserTypeById(
      updateUserTypeDto.ids,
      updateUserTypeDto,
    );
  }

  /**
   * deleteUserTypeById
   * deleteMultipleUserTypeById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteUserTypeById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.userTypeService.deleteUserTypeById(
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
  async deleteMultipleUserTypeById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.userTypeService.deleteMultipleUserTypeById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
