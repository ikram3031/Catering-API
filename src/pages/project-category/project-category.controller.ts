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
import { ProjectCategoryService } from './project-category.service';
import {
  AddProjectCategoryDto,
  FilterAndPaginationProjectCategoryDto,
  OptionProjectCategoryDto,
  UpdateProjectCategoryDto,
} from '../../dto/project-category.dto';

@Controller('projectCategory')
export class ProjectCategoryController {
  private logger = new Logger(ProjectCategoryController.name);

  constructor(private projectCategoryService: ProjectCategoryService) {}

  /**
   * addProjectCategory
   * insertManyProjectCategory
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addProjectCategory(
    @Body()
    addProjectCategoryDto: AddProjectCategoryDto,
  ): Promise<ResponsePayload> {
    return await this.projectCategoryService.addProjectCategory(
      addProjectCategoryDto,
    );
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyProjectCategory(
    @Body()
    body: {
      data: AddProjectCategoryDto[];
      option: OptionProjectCategoryDto;
    },
  ): Promise<ResponsePayload> {
    return await this.projectCategoryService.insertManyProjectCategory(
      body.data,
      body.option,
    );
  }

  /**
   * getAllProjectCategorys
   * getProjectCategoryById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllProjectCategorys(
    @Body() filterProjectCategoryDto: FilterAndPaginationProjectCategoryDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.projectCategoryService.getAllProjectCategorys(
      filterProjectCategoryDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getProjectCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.projectCategoryService.getProjectCategoryById(id, select);
  }

  /**
   * updateProjectCategoryById
   * updateMultipleProjectCategoryById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateProjectCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateProjectCategoryDto: UpdateProjectCategoryDto,
  ): Promise<ResponsePayload> {
    return await this.projectCategoryService.updateProjectCategoryById(
      id,
      updateProjectCategoryDto,
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
  async updateMultipleProjectCategoryById(
    @Body() updateProjectCategoryDto: UpdateProjectCategoryDto,
  ): Promise<ResponsePayload> {
    return await this.projectCategoryService.updateMultipleProjectCategoryById(
      updateProjectCategoryDto.ids,
      updateProjectCategoryDto,
    );
  }

  /**
   * deleteProjectCategoryById
   * deleteMultipleProjectCategoryById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteProjectCategoryById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.projectCategoryService.deleteProjectCategoryById(
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
  async deleteMultipleProjectCategoryById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.projectCategoryService.deleteMultipleProjectCategoryById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
