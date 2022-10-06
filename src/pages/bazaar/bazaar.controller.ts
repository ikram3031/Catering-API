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
import { BazaarService } from './bazaar.service';
import {
  AddBazaarDto,
  FilterAndPaginationBazaarDto,
  OptionBazaarDto,
  UpdateBazaarDto,
} from '../../dto/bazaar.dto';
import { UserJwtAuthGuard } from '../../guards/user-jwt-auth.guard';
import { UserMetaRoles } from '../../decorator/user-roles.decorator';
import { UserRoles } from '../../enum/user-roles.enum';
import { UserRolesGuard } from '../../guards/user-roles.guard';
import { GetUser } from '../../decorator/get-user.decorator';
import { User } from '../../interfaces/user.interface';

@Controller('bazaar')
export class BazaarController {
  private logger = new Logger(BazaarController.name);

  constructor(private bazaarService: BazaarService) {}

  /**
   * ADD DATA
   * addBazaar()
   * insertManyBazaar()
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @UserMetaRoles(UserRoles.ADMIN, UserRoles.MANGER)
  @UseGuards(UserRolesGuard)
  @UseGuards(UserJwtAuthGuard)
  async addBazaar(
    @Body() addBazaarDto: AddBazaarDto,
    @GetUser() user: User,
  ): Promise<ResponsePayload> {
    return await this.bazaarService.addBazaar(user, addBazaarDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyBazaar(
    @Body()
    body: {
      data: AddBazaarDto[];
      option: OptionBazaarDto;
    },
  ): Promise<ResponsePayload> {
    return await this.bazaarService.insertManyBazaar(body.data, body.option);
  }

  /**
   * GET DATA
   * getAllBazaars()
   * getBazaarsByDate()
   * getBazaarById()
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @UserMetaRoles(UserRoles.ADMIN, UserRoles.MANGER)
  @UseGuards(UserRolesGuard)
  @UseGuards(UserJwtAuthGuard)
  async getAllBazaars(
    @Body() filterAndPaginationBazaarDto: FilterAndPaginationBazaarDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.bazaarService.getAllBazaars(
      filterAndPaginationBazaarDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-date')
  async getBazaarsByDate(
    @Query('date') date: string,
  ): Promise<ResponsePayload> {
    return this.bazaarService.getBazaarsByDate(date);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async getBazaarById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.bazaarService.getBazaarById(id, select);
  }

  /**
   * UPDATE DATA
   * updateBazaarById()
   * updateMultipleBazaarById()
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @UserMetaRoles(UserRoles.ADMIN, UserRoles.MANGER)
  @UseGuards(UserRolesGuard)
  @UseGuards(UserJwtAuthGuard)
  async updateBazaarById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateBazaarDto: UpdateBazaarDto,
    @GetUser() user: User,
  ): Promise<ResponsePayload> {
    return await this.bazaarService.updateBazaarById(user, id, updateBazaarDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleBazaarById(
    @Body() updateBazaarDto: UpdateBazaarDto,
  ): Promise<ResponsePayload> {
    return await this.bazaarService.updateMultipleBazaarById(
      updateBazaarDto.ids,
      updateBazaarDto,
    );
  }

  /**
   * DELETE DATA
   * deleteBazaarById()
   * deleteMultipleBazaarById()
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  // @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.DELETE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async deleteBazaarById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.bazaarService.deleteBazaarById(id, Boolean(checkUsage));
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleBazaarById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.bazaarService.deleteMultipleBazaarById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
