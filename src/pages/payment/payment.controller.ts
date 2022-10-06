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
import { PaymentService } from './payment.service';
import {
  AddPaymentDto,
  FilterAndPaginationPaymentDto,
  OptionPaymentDto,
  UpdatePaymentDto,
} from '../../dto/payment.dto';
import { UserJwtAuthGuard } from '../../guards/user-jwt-auth.guard';
import { UserMetaRoles } from '../../decorator/user-roles.decorator';
import { UserRoles } from '../../enum/user-roles.enum';
import { UserRolesGuard } from '../../guards/user-roles.guard';
import { GetUser } from '../../decorator/get-user.decorator';
import { User } from '../../interfaces/user.interface';

@Controller('payment')
export class PaymentController {
  private logger = new Logger(PaymentController.name);

  constructor(private paymentService: PaymentService) {}

  /**
   * ADD DATA
   * addPayment()
   * insertManyPayment()
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @UserMetaRoles(UserRoles.ADMIN, UserRoles.MANGER)
  @UseGuards(UserRolesGuard)
  @UseGuards(UserJwtAuthGuard)
  async addPayment(
    @Body() addPaymentDto: AddPaymentDto,
    @GetUser() user: User,
  ): Promise<ResponsePayload> {
    return await this.paymentService.addPayment(user, addPaymentDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyPayment(
    @Body()
    body: {
      data: AddPaymentDto[];
      option: OptionPaymentDto;
    },
  ): Promise<ResponsePayload> {
    return await this.paymentService.insertManyPayment(body.data, body.option);
  }

  /**
   * GET DATA
   * getAllPayments()
   * getPaymentsByDate()
   * getPaymentById()
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @UserMetaRoles(UserRoles.ADMIN, UserRoles.MANGER)
  @UseGuards(UserRolesGuard)
  @UseGuards(UserJwtAuthGuard)
  async getAllPayments(
    @Body() filterAndPaginationPaymentDto: FilterAndPaginationPaymentDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.paymentService.getAllPayments(
      filterAndPaginationPaymentDto,
      searchString,
    );
  }

  @Version(VERSION_NEUTRAL)
  @Get('/get-by-date')
  async getPaymentsByDate(
    @Query('date') date: string,
  ): Promise<ResponsePayload> {
    return this.paymentService.getPaymentsByDate(date);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async getPaymentById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.paymentService.getPaymentById(id, select);
  }

  /**
   * UPDATE DATA
   * updatePaymentById()
   * updateMultiplePaymentById()
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @UserMetaRoles(UserRoles.ADMIN, UserRoles.MANGER)
  @UseGuards(UserRolesGuard)
  @UseGuards(UserJwtAuthGuard)
  async updatePaymentById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @GetUser() user: User,
  ): Promise<ResponsePayload> {
    return await this.paymentService.updatePaymentById(user, id, updatePaymentDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultiplePaymentById(
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<ResponsePayload> {
    return await this.paymentService.updateMultiplePaymentById(
      updatePaymentDto.ids,
      updatePaymentDto,
    );
  }

  /**
   * DELETE DATA
   * deletePaymentById()
   * deleteMultiplePaymentById()
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  // @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.DELETE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async deletePaymentById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.paymentService.deletePaymentById(id, Boolean(checkUsage));
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultiplePaymentById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.paymentService.deleteMultiplePaymentById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
