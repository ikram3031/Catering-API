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
import { GetTokenUser } from '../../decorator/get-token-user.decorator';
import { Admin } from '../../interfaces/admin.interface';
import {
  AddAdmissionTargetDto,
  FilterAndPaginationAdmissionTargetDto,
  OptionAdmissionTargetDto,
  UpdateAdmissionTargetDto,
} from '../../dto/admission-target.dto';
import { AdmissionTargetService } from './admission-target.service';
import { User } from '../../interfaces/user.interface';
import { UserJwtAuthGuard } from '../../guards/user-jwt-auth.guard';

@Controller('admission-target')
export class AdmissionTargetController {
  private logger = new Logger(AdmissionTargetController.name);

  constructor(private admissionTargetService: AdmissionTargetService) {}

  /**
   * addAdmissionTarget
   * insertManyAdmissionTarget
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addAdmissionTarget(
    @GetTokenUser() admin: Admin,
    @Body()
    addAdmissionTargetDto: AddAdmissionTargetDto,
  ): Promise<ResponsePayload> {
    return await this.admissionTargetService.addAdmissionTarget(
      admin,
      addAdmissionTargetDto,
    );
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyAdmissionTarget(
    @Body()
    body: {
      data: AddAdmissionTargetDto[];
      option: OptionAdmissionTargetDto;
    },
  ): Promise<ResponsePayload> {
    return await this.admissionTargetService.insertManyAdmissionTarget(
      body.data,
      body.option,
    );
  }

  /**
   * getAllAdmissionTargets
   * getAdmissionTargetById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllAdmissionTargets(
    @Body() filterAdmissionTargetDto: FilterAndPaginationAdmissionTargetDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.admissionTargetService.getAllAdmissionTargets(
      filterAdmissionTargetDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getAdmissionTargetById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.admissionTargetService.getAdmissionTargetById(id, select);
  }

  /**
   * updateAdmissionTargetById
   * updateMultipleAdmissionTargetById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateAdmissionTargetById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateAdmissionTargetDto: UpdateAdmissionTargetDto,
  ): Promise<ResponsePayload> {
    return await this.admissionTargetService.updateAdmissionTargetById(
      id,
      updateAdmissionTargetDto,
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
  async updateMultipleAdmissionTargetById(
    @Body() updateAdmissionTargetDto: UpdateAdmissionTargetDto,
  ): Promise<ResponsePayload> {
    return await this.admissionTargetService.updateMultipleAdmissionTargetById(
      updateAdmissionTargetDto.ids,
      updateAdmissionTargetDto,
    );
  }

  /**
   * deleteAdmissionTargetById
   * deleteMultipleAdmissionTargetById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteAdmissionTargetById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.admissionTargetService.deleteAdmissionTargetById(
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
  async deleteMultipleAdmissionTargetById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.admissionTargetService.deleteMultipleAdmissionTargetById(
      data.ids,
      Boolean(checkUsage),
    );
  }

  /**
   * USER ACCESS
   * getAllAdmissionTargetsByUser()
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async getAllAdmissionTargetsByUser(
    @GetTokenUser() user: User,
    @Body() filterAdmissionTargetDto: FilterAndPaginationAdmissionTargetDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.admissionTargetService.getAllAdmissionTargetsByUser(
      user,
      filterAdmissionTargetDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/check-admission-target-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async checkAdmissionTargetsByUser(
    @GetTokenUser() user: User,
    @Body() filterAdmissionTargetDto: FilterAndPaginationAdmissionTargetDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.admissionTargetService.checkAdmissionTargetsByUser(
      user,
      filterAdmissionTargetDto,
      searchString,
    );
  }
}
