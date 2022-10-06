import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import { Notification } from '../../interfaces/notification.interface';
import {
  AddNotificationDto,
  FilterAndPaginationNotificationDto,
  OptionNotificationDto,
  UpdateNotificationDto,
} from '../../dto/notification.dto';
import { Cache } from 'cache-manager';
import { User } from '../../interfaces/user.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class NotificationService {
  private logger = new Logger(NotificationService.name);
  // Cache
  private readonly cacheAllData = 'getAllNotification';
  private readonly cacheDataCount = 'getCountNotification';

  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<Notification>,
    @InjectModel('User') private readonly projectModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
  }

  /**
   * addNotification
   * insertManyNotification
   */
  async addNotification(
    addNotificationDto: AddNotificationDto,
  ): Promise<ResponsePayload> {
    const newData = new this.notificationModel(addNotificationDto);
    try {
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
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyNotification(
    addNotificationsDto: AddNotificationDto[],
    optionNotificationDto: OptionNotificationDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionNotificationDto;
    if (deleteMany) {
      await this.notificationModel.deleteMany({});
    }
    try {
      const saveData = await this.notificationModel.insertMany(
        addNotificationsDto,
      );
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
   * getAllNotifications
   * getNotificationById
   */

  async getAllNotifications(
    filterNotificationDto: FilterAndPaginationNotificationDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterNotificationDto;
    const { pagination } = filterNotificationDto;
    const { sort } = filterNotificationDto;
    const { select } = filterNotificationDto;

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
    const aggregateSnotificationes = [];
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
      aggregateSnotificationes.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSnotificationes.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSnotificationes.push({ $project: mSelect });
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

      aggregateSnotificationes.push(mPagination);

      aggregateSnotificationes.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.notificationModel.aggregate(
        aggregateSnotificationes,
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

  async getNotificationById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.notificationModel.findById(id).select(select);
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
   * updateNotificationById
   * updateMultipleNotificationById
   */
  async updateNotificationById(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.notificationModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.notificationModel.findByIdAndUpdate(id, {
        $set: updateNotificationDto,
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

  async updateMultipleNotificationById(
    ids: string[],
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.notificationModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateNotificationDto },
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
   * deleteNotificationById
   * deleteMultipleNotificationById
   */
  async deleteNotificationById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.notificationModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    if (data.readOnly) {
      throw new NotFoundException('Sorry! Read only data can not be deleted');
    }
    try {
      await this.notificationModel.findByIdAndDelete(id);
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        // const defaultData = await this.notificationModel.findOne({
        //   readOnly: true,
        // });
        // const resetData = {
        //   notification: {
        //     _id: defaultData._id,
        //     name: defaultData.name,
        //   },
        // };
        // // Update Deleted Data
        // await this.projectModel.updateMany(
        //   { 'notification._id': new ObjectId(id) },
        //   { $set: resetData },
        // );
        // await this.taskModel.updateMany(
        //   { 'notification._id': new ObjectId(id) },
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

  async deleteMultipleNotificationById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      // Remove Read Only Data
      const allData = await this.notificationModel.find({ _id: { $in: mIds } });

      await this.notificationModel.deleteMany({ _id: mIds });
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        // const defaultData = await this.notificationModel.findOne({
        //   readOnly: true,
        // });
        // const resetData = {
        //   notification: {
        //     _id: defaultData._id,
        //     name: defaultData.name,
        //   },
        // };
        //
        // // Update Product
        // await this.projectModel.updateMany(
        //   { 'notification._id': { $in: mIds } },
        //   { $set: resetData },
        // );
        // await this.taskModel.updateMany(
        //   { 'notification._id': { $in: mIds } },
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
