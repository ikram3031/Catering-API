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
import { UserType } from '../../interfaces/user-type.interface';
import {
  AddUserTypeDto,
  FilterAndPaginationUserTypeDto,
  OptionUserTypeDto,
  UpdateUserTypeDto,
} from '../../dto/user-type.dto';
import { User } from '../../interfaces/user.interface';
import { Cache } from 'cache-manager';

const ObjectId = Types.ObjectId;

@Injectable()
export class UserTypeService {
  private logger = new Logger(UserTypeService.name);
  // Cache
  private readonly cacheAllData = 'getAllUserType';
  private readonly cacheDataCount = 'getCountUserType';

  constructor(
    @InjectModel('UserType') private readonly userTypeModel: Model<UserType>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * addUserType
   * insertManyUserType
   */
  async addUserType(addUserTypeDto: AddUserTypeDto): Promise<ResponsePayload> {
    const newData = new this.userTypeModel(addUserTypeDto);
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

  async insertManyUserType(
    addUserTypesDto: AddUserTypeDto[],
    optionUserTypeDto: OptionUserTypeDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionUserTypeDto;
    if (deleteMany) {
      await this.userTypeModel.deleteMany({});
    }
    try {
      const saveData = await this.userTypeModel.insertMany(addUserTypesDto);
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
   * getAllUserTypes
   * getUserTypeById
   */

  async getAllUserTypes(
    filterUserTypeDto: FilterAndPaginationUserTypeDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterUserTypeDto;
    const { pagination } = filterUserTypeDto;
    const { sort } = filterUserTypeDto;
    const { select } = filterUserTypeDto;

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
    const aggregateSuserTypees = [];
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
      aggregateSuserTypees.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSuserTypees.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSuserTypees.push({ $project: mSelect });
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

      aggregateSuserTypees.push(mPagination);

      aggregateSuserTypees.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.userTypeModel.aggregate(
        aggregateSuserTypees,
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

  async getUserTypeById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.userTypeModel.findById(id).select(select);
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
   * updateUserTypeById
   * updateMultipleUserTypeById
   */
  async updateUserTypeById(
    id: string,
    updateUserTypeDto: UpdateUserTypeDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.userTypeModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.userTypeModel.findByIdAndUpdate(id, {
        $set: updateUserTypeDto,
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

  async updateMultipleUserTypeById(
    ids: string[],
    updateUserTypeDto: UpdateUserTypeDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.userTypeModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateUserTypeDto },
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
   * deleteUserTypeById
   * deleteMultipleUserTypeById
   */
  async deleteUserTypeById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.userTypeModel.findById(id);
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
      await this.userTypeModel.findByIdAndDelete(id);
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        const defaultData = await this.userTypeModel.findOne({
          readOnly: true,
        });
        const resetData = {
          userType: {
            _id: defaultData._id,
            name: defaultData.name,
          },
        };
        // Update Deleted Data
        await this.userModel.updateMany(
          { 'userType._id': new ObjectId(id) },
          { $set: resetData },
        );
      }

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleUserTypeById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      // Remove Read Only Data
      const allData = await this.userTypeModel.find({ _id: { $in: mIds } });
      const filteredIds = allData
        .filter((f) => f.readOnly !== true)
        .map((m) => m._id);
      await this.userTypeModel.deleteMany({ _id: filteredIds });
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        const defaultData = await this.userTypeModel.findOne({
          readOnly: true,
        });
        const resetData = {
          userType: {
            _id: defaultData._id,
            name: defaultData.name,
          },
        };

        // Update Product
        await this.userModel.updateMany(
          { 'userType._id': { $in: mIds } },
          { $set: resetData },
        );
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
