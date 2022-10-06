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
import { MenuService } from './menu.service';
import {
  AddMenuDto,
  FilterAndPaginationMenuDto,
  OptionMenuDto,
  UpdateMenuDto,
} from '../../dto/menu.dto';
import { UserJwtAuthGuard } from '../../guards/user-jwt-auth.guard';
import { UserMetaRoles } from '../../decorator/user-roles.decorator';
import { UserRoles } from '../../enum/user-roles.enum';
import { UserRolesGuard } from '../../guards/user-roles.guard';
import { GetUser } from '../../decorator/get-user.decorator';
import { User } from '../../interfaces/user.interface';

@Controller('menu')
export class MenuController {
  private logger = new Logger(MenuController.name);

  constructor(private menuService: MenuService) {}

  /**
   * ADD DATA
   * addMenu()
   * insertManyMenu()
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @UserMetaRoles(UserRoles.ADMIN, UserRoles.MANGER)
  @UseGuards(UserRolesGuard)
  @UseGuards(UserJwtAuthGuard)
  async addMenu(
    @Body() addMenuDto: AddMenuDto,
    @GetUser() user: User,
  ): Promise<ResponsePayload> {
    return await this.menuService.addMenu(user, addMenuDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyMenu(
    @Body()
    body: {
      data: AddMenuDto[];
      option: OptionMenuDto;
    },
  ): Promise<ResponsePayload> {
    return await this.menuService.insertManyMenu(body.data, body.option);
  }

  /**
   * GET DATA
   * getAllMenus()
   * getMenusByDate()
   * getMenuById()
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllMenus(
    @Body() filterMenuDto: FilterAndPaginationMenuDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.menuService.getAllMenus(filterMenuDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-date')
  async getMenusByDate(@Query('date') date: string): Promise<ResponsePayload> {
    return this.menuService.getMenusByDate(date);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async getMenuById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.menuService.getMenuById(id, select);
  }

  /**
   * UPDATE DATA
   * updateMenuById()
   * updateMultipleMenuById()
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @UserMetaRoles(UserRoles.ADMIN, UserRoles.MANGER)
  @UseGuards(UserRolesGuard)
  @UseGuards(UserJwtAuthGuard)
  async updateMenuById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @GetUser() user: User,
  ): Promise<ResponsePayload> {
    return await this.menuService.updateMenuById(user, id, updateMenuDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleMenuById(
    @Body() updateMenuDto: UpdateMenuDto,
  ): Promise<ResponsePayload> {
    return await this.menuService.updateMultipleMenuById(
      updateMenuDto.ids,
      updateMenuDto,
    );
  }

  /**
   * DELETE DATA
   * deleteMenuById()
   * deleteMultipleMenuById()
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  // @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.DELETE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async deleteMenuById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.menuService.deleteMenuById(id, Boolean(checkUsage));
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleMenuById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.menuService.deleteMultipleMenuById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
