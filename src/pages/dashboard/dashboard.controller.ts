import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { FilterAndPaginationUserDto } from '../../dto/user.dto';
import { UserJwtAuthGuard } from '../../guards/user-jwt-auth.guard';
import { GetTokenUser } from '../../decorator/get-token-user.decorator';
import { User } from '../../interfaces/user.interface';
import { FilterAndPaginationTaskDto } from '../../dto/task.dto';
import { GetUser } from '../../decorator/get-user.decorator';
import { Admin } from '../../interfaces/admin.interface';
import { FilterAndPaginationProjectDto } from '../../dto/project.dto';

@Controller('dashboard')
export class DashboardController {
  private logger = new Logger(DashboardController.name);

  constructor(private dashboardService: DashboardService) {}

  @Version(VERSION_NEUTRAL)
  @Get('/admin-dashboard')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getAdminDashboard(): Promise<ResponsePayload> {
    return await this.dashboardService.getAdminDashboard();
  }

  @Version(VERSION_NEUTRAL)
  @Post('/resources')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getResources(
    @Body() filterUserDto: FilterAndPaginationUserDto,
    @Query('isFree') isFree: string,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getResources(
      isFree,
      filterUserDto,
      searchString,
    );
  }

  /**
   * USER ACCESS API
   */
  @Version(VERSION_NEUTRAL)
  @Get('/user-dashboard')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async getUserDashboard(@GetTokenUser() user: User): Promise<ResponsePayload> {
    return await this.dashboardService.getUserDashboard(user);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/project-by-logged-in-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async getUserProjects(
    @GetTokenUser() user: User,
    @Body() filterProjectDto: FilterAndPaginationProjectDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.dashboardService.getUserProjects(
      user,
      filterProjectDto,
      searchString,
    );
  }
}
