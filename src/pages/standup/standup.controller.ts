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
import { StandupService } from './standup.service';
import {
  AddStandupDto,
  FilterAndPaginationStandupDto,
  OptionStandupDto,
  UpdateStandupDto,
} from '../../dto/standup.dto';
import { GetTokenUser } from '../../decorator/get-token-user.decorator';
import { Admin } from '../../interfaces/admin.interface';
import { User } from '../../interfaces/user.interface';
import { UserJwtAuthGuard } from '../../guards/user-jwt-auth.guard';

@Controller('standup')
export class StandupController {
  private logger = new Logger(StandupController.name);

  constructor(private standupService: StandupService) {}

  /**
   * addStandup
   * insertManyStandup
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addStandup(
    @GetTokenUser() admin: Admin,
    @Body()
    addStandupDto: AddStandupDto,
  ): Promise<ResponsePayload> {
    return await this.standupService.addStandup(addStandupDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyStandup(
    @Body()
    body: {
      data: AddStandupDto[];
      option: OptionStandupDto;
    },
  ): Promise<ResponsePayload> {
    return await this.standupService.insertManyStandup(body.data, body.option);
  }

  /**
   * getAllStandups
   * getStandupById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllStandups(
    @Body() filterStandupDto: FilterAndPaginationStandupDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.standupService.getAllStandups(filterStandupDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  async getStandupById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.standupService.getStandupById(id, select);
  }

  /**
   * updateStandupById
   * updateMultipleStandupById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateStandupById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateStandupDto: UpdateStandupDto,
  ): Promise<ResponsePayload> {
    return await this.standupService.updateStandupById(id, updateStandupDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleStandupById(
    @Body() updateStandupDto: UpdateStandupDto,
  ): Promise<ResponsePayload> {
    return await this.standupService.updateMultipleStandupById(
      updateStandupDto.ids,
      updateStandupDto,
    );
  }

  /**
   * deleteStandupById
   * deleteMultipleStandupById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteStandupById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.standupService.deleteStandupById(id, Boolean(checkUsage));
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleStandupById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.standupService.deleteMultipleStandupById(
      data.ids,
      Boolean(checkUsage),
    );
  }

  @Post('/add-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async addStandupByUser(
    @GetTokenUser() user: User,
    @Body()
    addStandupDto: AddStandupDto,
  ): Promise<ResponsePayload> {
    return await this.standupService.addStandupByUser(user, addStandupDto);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async getAllStandupsByUser(
    @GetTokenUser() user: User,
    @Body() filterStandupDto: FilterAndPaginationStandupDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.standupService.getAllStandupsByUser(
      user,
      filterStandupDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async deleteMultipleStandupByUser(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.standupService.deleteMultipleStandupById(
      data.ids,
      Boolean(checkUsage),
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-data-by-user/:id')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async updateStandupByUser(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateStandupDto: UpdateStandupDto,
  ): Promise<ResponsePayload> {
    return await this.standupService.updateStandupById(id, updateStandupDto);
  }
}
