import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../../shared/utils/utils.service';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import { User } from '../../interfaces/user.interface';
import { Expense } from '../../interfaces/expense.interface';
import {
  AddExpenseDto,
  FilterAndPaginationExpenseDto,
  OptionExpenseDto,
  UpdateExpenseDto,
} from '../../dto/expense.dto';
import { Admin } from '../../interfaces/admin.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class ExpenseService {
  private logger = new Logger(ExpenseService.name);

  constructor(
    @InjectModel('Expense')
    private readonly expenseModel: Model<Expense>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * addExpense
   * insertManyExpense
   */
  async addExpense(
    admin: Admin,
    addExpenseDto: AddExpenseDto,
  ): Promise<ResponsePayload> {
    const adminData = await this.adminModel.findById(admin._id).select('name');
    const newData = new this.expenseModel({
      ...addExpenseDto,
      ...{ admin: { _id: adminData._id, name: adminData.name } },
    });
    try {
      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Data Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyExpense(
    addExpensesDto: AddExpenseDto[],
    optionExpenseDto: OptionExpenseDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionExpenseDto;
    if (deleteMany) {
      await this.expenseModel.deleteMany({});
    }
    try {
      const saveData = await this.expenseModel.insertMany(addExpensesDto);
      return {
        success: true,
        message: `${
          saveData && saveData.length ? saveData.length : 0
        }  Data Added Success`,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * getAllExpenses
   * getExpenseById
   */

  async getAllExpenses(
    filterExpenseDto: FilterAndPaginationExpenseDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterExpenseDto;
    const { pagination } = filterExpenseDto;
    const { sort } = filterExpenseDto;
    const { select } = filterExpenseDto;

    // Modify Id as Object ID
    if (filter && filter['user._id']) {
      filter['user._id'] = new ObjectId(filter['user._id']);
    }

    if (filter && filter['admin._id']) {
      filter['admin._id'] = new ObjectId(filter['admin._id']);
    }

    // Essential Variables
    const aggregateSexpensees = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ name: new RegExp(searchQuery, 'i') } };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { createdAt: -1 };
    }

    // Select
    if (select) {
      mSelect = { ...select };
    } else {
      mSelect = { name: 1 };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateSexpensees.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSexpensees.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSexpensees.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateSexpensees.push(mPagination);

      aggregateSexpensees.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.expenseModel.aggregate(
        aggregateSexpensees,
      );
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Expenseion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getExpenseById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.expenseModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * updateExpenseById
   * updateMultipleExpenseById
   */
  async updateExpenseById(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.expenseModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.expenseModel.findByIdAndUpdate(id, {
        $set: updateExpenseDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleExpenseById(
    ids: string[],
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.expenseModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateExpenseDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * deleteExpenseById
   * deleteMultipleExpenseById
   */
  async deleteExpenseById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.expenseModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.expenseModel.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleExpenseById(
    ids: string[],
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.expenseModel.deleteMany({ _id: mIds });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
