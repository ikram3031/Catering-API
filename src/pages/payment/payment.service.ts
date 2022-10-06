import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import {
  AddPaymentDto,
  FilterAndPaginationPaymentDto,
  OptionPaymentDto,
  UpdatePaymentDto,
} from '../../dto/payment.dto';
import { Cache } from 'cache-manager';
import { UtilsService } from '../../shared/utils/utils.service';
import { User } from '../../interfaces/user.interface';
import { Payment } from '../../interfaces/common/payment.interface';
import { ErrorCodes } from '../../enum/error-code.enum';

const ObjectId = Types.ObjectId;

@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);
  // Cache
  private readonly cacheAllData = 'getAllPayment';
  private readonly cacheDataCount = 'getCountPayment';

  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<Payment>,
    @InjectModel('User')
    private readonly userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private utilsService: UtilsService,
  ) {}

  /**
   * ADD DATA
   * addPayment()
   * insertManyPayment()
   */
  async addPayment(
    userM: User,
    addPaymentDto: AddPaymentDto,
  ): Promise<ResponsePayload> {
    try {
      const { date, user } = addPaymentDto;
      const dateString = this.utilsService.getDateString(date);

      const userData = await this.userModel.findById(userM._id);
      const paymentUserData = await this.userModel.findById(user);
      const mData = {
        ...addPaymentDto,
        ...{
          month: this.utilsService.getDateMonth(false, dateString),
          date: dateString,
          createdBy: {
            _id: userData._id,
            name: userData.name,
          },
          user: {
            _id: paymentUserData._id,
            name: paymentUserData.name,
          },
        },
      };
      const newData = new this.paymentModel(mData);

      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
      };

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      return {
        success: true,
        message: 'Data Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyPayment(
    addPaymentsDto: AddPaymentDto[],
    optionPaymentDto: OptionPaymentDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionPaymentDto;
    if (deleteMany) {
      await this.paymentModel.deleteMany({});
    }
    try {
      const saveData = await this.paymentModel.insertMany(addPaymentsDto);
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

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
   * GET DATA
   * getAllPayments()
   * getPaymentsByDate()
   * getPaymentById()
   */

  async getAllPayments(
    filterPaymentDto: FilterAndPaginationPaymentDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterPaymentDto;
    const { pagination } = filterPaymentDto;
    const { sort } = filterPaymentDto;
    const { select } = filterPaymentDto;

    /*** GET FROM CACHE ***/
    if (!pagination && !filter) {
      const cacheData: any[] = await this.cacheManager.get(this.cacheAllData);
      const count: number = await this.cacheManager.get(this.cacheDataCount);
      if (cacheData) {
        this.logger.log('Cached page');
        return {
          data: cacheData,
          success: true,
          message: 'Success',
          count: count,
        } as ResponsePayload;
      }
    }
    this.logger.log('Not a Cached page');

    // Essential Variables
    const aggregateSpaymentes = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Modify Id as Object ID
    if (filter && filter['user._id']) {
      filter['user._id'] = new ObjectId(filter['user._id']);
    }

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
      aggregateSpaymentes.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSpaymentes.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSpaymentes.push({ $project: mSelect });
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

      aggregateSpaymentes.push(mPagination);

      aggregateSpaymentes.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.paymentModel.aggregate(
        aggregateSpaymentes,
      );
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        /*** SET CACHE DATA**/
        if (!filter) {
          await this.cacheManager.set(this.cacheAllData, dataAggregates);
          await this.cacheManager.set(
            this.cacheDataCount,
            dataAggregates.length,
          );
          this.logger.log('Cache Added');
        }

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
        throw new BadRequestException('Error! Projection mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getPaymentsByDate(
    date: string,
    select?: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.paymentModel
        .find({ date: date })
        .sort({ type: -1 });
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async getPaymentById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.paymentModel.findById(id).select(select);
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
   * UPDATE DATA
   * updatePaymentById()
   * updateMultiplePaymentById()
   */
  async updatePaymentById(
    user: User,
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<ResponsePayload> {
    try {
      const dateString = new Date();
      const userData = await this.userModel.findById(user._id);
      const mData = {
        ...updatePaymentDto,
        ...{
          month: this.utilsService.getDateMonth(false, dateString),
          lastUpdatedBy: {
            _id: userData._id,
            name: userData.name,
          },
        },
      };

      await this.paymentModel.findByIdAndUpdate(id, {
        $set: mData,
      });

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultiplePaymentById(
    ids: string[],
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.paymentModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updatePaymentDto },
      );

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * DELETE DATA
   * deletePaymentById()
   * deleteMultiplePaymentById()
   */
  async deletePaymentById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      console.log(id);
      await this.paymentModel.findByIdAndDelete(id);

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultiplePaymentById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      // Remove Read Only Data
      const allData = await this.paymentModel.find({ _id: { $in: mIds } });
      const filteredIds = allData
        .filter((f) => f['readOnly'] !== true)
        .map((m) => m._id);
      await this.paymentModel.deleteMany({ _id: filteredIds });
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        const defaultData = await this.paymentModel.findOne({
          readOnly: true,
        });
        // const resetData = {
        //   payment: {
        //     _id: defaultData._id,
        //     name: defaultData.name,
        //   },
        // };
        //
        // // Update Product
        // await this.projectModel.updateMany(
        //   { 'payment._id': { $in: mIds } },
        //   { $set: resetData },
        // );
        // await this.taskModel.updateMany(
        //   { 'payment._id': { $in: mIds } },
        //   { $set: resetData },
        // );
      }
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
