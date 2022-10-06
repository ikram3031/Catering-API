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
import { AdmissionService } from './admission.service';
import {
  AddAdmissionDto,
  FilterAndPaginationAdmissionDto,
  OptionAdmissionDto,
  UpdateAdmissionDto,
} from '../../dto/admission.dto';
import { GetTokenUser } from '../../decorator/get-token-user.decorator';
import { Admin } from '../../interfaces/admin.interface';
import { User } from '../../interfaces/user.interface';
import { UserJwtAuthGuard } from '../../guards/user-jwt-auth.guard';

@Controller('admission')
export class AdmissionController {
  private logger = new Logger(AdmissionController.name);

  constructor(private admissionService: AdmissionService) {}

  /**
   * addAdmission
   * insertManyAdmission
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addAdmission(
    @GetTokenUser() admin: Admin,
    @Body()
    addAdmissionDto: AddAdmissionDto,
  ): Promise<ResponsePayload> {
    return await this.admissionService.addAdmission(addAdmissionDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyAdmission(
    @Body()
    body: {
      data: AddAdmissionDto[];
      option: OptionAdmissionDto;
    },
  ): Promise<ResponsePayload> {
    return await this.admissionService.insertManyAdmission(
      body.data,
      body.option,
    );
  }

  /**
   * getAllAdmissions
   * getAdmissionById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllAdmissions(
    @Body() filterAdmissionDto: FilterAndPaginationAdmissionDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.admissionService.getAllAdmissions(
      filterAdmissionDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  async getAdmissionById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.admissionService.getAdmissionById(id, select);
  }

  /**
   * updateAdmissionById
   * updateMultipleAdmissionById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateAdmissionById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateAdmissionDto: UpdateAdmissionDto,
  ): Promise<ResponsePayload> {
    return await this.admissionService.updateAdmissionById(
      id,
      updateAdmissionDto,
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
  async updateMultipleAdmissionById(
    @Body() updateAdmissionDto: UpdateAdmissionDto,
  ): Promise<ResponsePayload> {
    return await this.admissionService.updateMultipleAdmissionById(
      updateAdmissionDto.ids,
      updateAdmissionDto,
    );
  }

  /**
   * deleteAdmissionById
   * deleteMultipleAdmissionById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteAdmissionById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.admissionService.deleteAdmissionById(
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
  async deleteMultipleAdmissionById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.admissionService.deleteMultipleAdmissionById(
      data.ids,
      Boolean(checkUsage),
    );
  }

  @Post('/add-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async addAdmissionByUser(
    @GetTokenUser() user: User,
    @Body()
    addAdmissionDto: AddAdmissionDto,
  ): Promise<ResponsePayload> {
    return await this.admissionService.addAdmissionByUser(
      user,
      addAdmissionDto,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/get-all-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async getAllAdmissionsByUser(
    @GetTokenUser() user: User,
    @Body() filterAdmissionDto: FilterAndPaginationAdmissionDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.admissionService.getAllAdmissionsByUser(
      user,
      filterAdmissionDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async deleteMultipleAdmissionByUser(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.admissionService.deleteMultipleAdmissionById(
      data.ids,
      Boolean(checkUsage),
    );
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-data-by-user/:id')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async updateAdmissionByUser(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateAdmissionDto: UpdateAdmissionDto,
  ): Promise<ResponsePayload> {
    return await this.admissionService.updateAdmissionById(
      id,
      updateAdmissionDto,
    );
  }
}
