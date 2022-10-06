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
import { InvoiceService } from './invoice.service';
import {
  AddInvoiceDto,
  FilterAndPaginationInvoiceDto,
  OptionInvoiceDto,
  UpdateInvoiceDto,
} from '../../dto/invoice.dto';
import { GetTokenUser } from '../../decorator/get-token-user.decorator';
import { Admin } from '../../interfaces/admin.interface';

@Controller('invoice')
export class InvoiceController {
  private logger = new Logger(InvoiceController.name);

  constructor(private invoiceService: InvoiceService) {}

  /**
   * addInvoice
   * insertManyInvoice
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.ACCOUNTANT,)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addInvoice(
    @GetTokenUser() admin: Admin,
    @Body()
    addInvoiceDto: AddInvoiceDto,
  ): Promise<ResponsePayload> {
    return await this.invoiceService.addInvoice(admin, addInvoiceDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyInvoice(
    @Body()
    body: {
      data: AddInvoiceDto[];
      option: OptionInvoiceDto;
    },
  ): Promise<ResponsePayload> {
    return await this.invoiceService.insertManyInvoice(body.data, body.option);
  }

  /**
   * getAllInvoices
   * getInvoiceById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllInvoices(
    @Body() filterInvoiceDto: FilterAndPaginationInvoiceDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.invoiceService.getAllInvoices(filterInvoiceDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.ACCOUNTANT,)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getInvoiceById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.invoiceService.getInvoiceById(id, select);
  }

  /**
   * updateInvoiceById
   * updateMultipleInvoiceById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.ACCOUNTANT,)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateInvoiceById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<ResponsePayload> {
    return await this.invoiceService.updateInvoiceById(id, updateInvoiceDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.ACCOUNTANT,)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleInvoiceById(
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<ResponsePayload> {
    return await this.invoiceService.updateMultipleInvoiceById(
      updateInvoiceDto.ids,
      updateInvoiceDto,
    );
  }

  /**
   * deleteInvoiceById
   * deleteMultipleInvoiceById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.ACCOUNTANT,)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteInvoiceById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.invoiceService.deleteInvoiceById(id, Boolean(checkUsage));
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.ACCOUNTANT,)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleInvoiceById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.invoiceService.deleteMultipleInvoiceById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
