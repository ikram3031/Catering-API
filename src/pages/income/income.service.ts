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
import { Income } from '../../interfaces/income.interface';
import {
  AddIncomeDto,
  FilterAndPaginationIncomeDto,
  OptionIncomeDto,
  UpdateIncomeDto,
} from '../../dto/income.dto';
import { Admin } from '../../interfaces/admin.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class IncomeService {
  private logger = new Logger(IncomeService.name);

  constructor(
    @InjectModel('Income')
    private readonly incomeModel: Model<Income>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * addIncome
   * insertManyIncome
   */
  async addIncome(
    admin: Admin,
    addIncomeDto: AddIncomeDto,
  ): Promise<ResponsePayload> {
    const adminData = await this.adminModel.findById(admin._id).select('name');
    const newData = new this.incomeModel({
      ...addIncomeDto,
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

  async insertManyIncome(
    addIncomesDto: AddIncomeDto[],
    optionIncomeDto: OptionIncomeDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionIncomeDto;
    if (deleteMany) {
      await this.incomeModel.deleteMany({});
    }
    try {
      const saveData = await this.incomeModel.insertMany(addIncomesDto);
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
   * getAllIncomes
   * getIncomeById
   */

  async getAllIncomes(
    filterIncomeDto: FilterAndPaginationIncomeDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterIncomeDto;
    const { pagination } = filterIncomeDto;
    const { sort } = filterIncomeDto;
    const { select } = filterIncomeDto;

    // Modify Id as Object ID
    if (filter && filter['project._id']) {
      filter['project._id'] = new ObjectId(filter['project._id']);
    }

    if (filter && filter['admin._id']) {
      filter['admin._id'] = new ObjectId(filter['admin._id']);
    }

    // Essential Variables
    const aggregateSincomees = [];
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
      aggregateSincomees.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSincomees.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSincomees.push({ $project: mSelect });
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

      aggregateSincomees.push(mPagination);

      aggregateSincomees.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.incomeModel.aggregate(
        aggregateSincomees,
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
        throw new BadRequestException('Error! Incomeion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getIncomeById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.incomeModel.findById(id).select(select);
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
   * updateIncomeById
   * updateMultipleIncomeById
   */
  async updateIncomeById(
    id: string,
    updateIncomeDto: UpdateIncomeDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.incomeModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.incomeModel.findByIdAndUpdate(id, {
        $set: updateIncomeDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleIncomeById(
    ids: string[],
    updateIncomeDto: UpdateIncomeDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.incomeModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateIncomeDto },
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
   * deleteIncomeById
   * deleteMultipleIncomeById
   */
  async deleteIncomeById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.incomeModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.incomeModel.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleIncomeById(
    ids: string[],
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.incomeModel.deleteMany({ _id: mIds });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
