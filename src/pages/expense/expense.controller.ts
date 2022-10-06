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
import { ExpenseService } from './expense.service';
import {
  AddExpenseDto,
  FilterAndPaginationExpenseDto,
  OptionExpenseDto,
  UpdateExpenseDto,
} from '../../dto/expense.dto';
import { GetTokenUser } from '../../decorator/get-token-user.decorator';
import { Admin } from '../../interfaces/admin.interface';

@Controller('expense')
export class ExpenseController {
  private logger = new Logger(ExpenseController.name);

  constructor(private expenseService: ExpenseService) {}

  /**
   * addExpense
   * insertManyExpense
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.ADMIN,
    AdminRoles.ACCOUNTANT,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addExpense(
    @GetTokenUser() admin: Admin,
    @Body()
    addExpenseDto: AddExpenseDto,
  ): Promise<ResponsePayload> {
    return await this.expenseService.addExpense(admin, addExpenseDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyExpense(
    @Body()
    body: {
      data: AddExpenseDto[];
      option: OptionExpenseDto;
    },
  ): Promise<ResponsePayload> {
    return await this.expenseService.insertManyExpense(body.data, body.option);
  }

  /**
   * getAllExpenses
   * getExpenseById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllExpenses(
    @Body() filterExpenseDto: FilterAndPaginationExpenseDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.expenseService.getAllExpenses(filterExpenseDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.ADMIN,
    AdminRoles.ACCOUNTANT,
  )
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getExpenseById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.expenseService.getExpenseById(id, select);
  }

  /**
   * updateExpenseById
   * updateMultipleExpenseById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.ADMIN,
    AdminRoles.ACCOUNTANT,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateExpenseById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ResponsePayload> {
    return await this.expenseService.updateExpenseById(id, updateExpenseDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.ADMIN,
    AdminRoles.ACCOUNTANT,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleExpenseById(
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ResponsePayload> {
    return await this.expenseService.updateMultipleExpenseById(
      updateExpenseDto.ids,
      updateExpenseDto,
    );
  }

  /**
   * deleteExpenseById
   * deleteMultipleExpenseById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.ADMIN,
    AdminRoles.ACCOUNTANT,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteExpenseById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.expenseService.deleteExpenseById(id, Boolean(checkUsage));
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.ADMIN,
    AdminRoles.ACCOUNTANT,
  )
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleExpenseById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.expenseService.deleteMultipleExpenseById(
      data.ids,
      Boolean(checkUsage),
    );
  }
}
