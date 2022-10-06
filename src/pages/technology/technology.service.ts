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
import { User } from '../../interfaces/user.interface';
import { Technology } from '../../interfaces/technology.interface';
import {
  AddTechnologyDto,
  FilterAndPaginationTechnologyDto,
  OptionTechnologyDto,
  UpdateTechnologyDto,
} from '../../dto/technology.dto';
import { Cache } from 'cache-manager';
import { Project } from '../../interfaces/project.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class TechnologyService {
  private logger = new Logger(TechnologyService.name);
  // Cache
  private readonly cacheAllData = 'getAllTechnology';
  private readonly cacheDataCount = 'getCountTechnology';

  constructor(
    @InjectModel('Technology')
    private readonly technologyModel: Model<Technology>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Project') private readonly projectModel: Model<Project>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * addTechnology
   * insertManyTechnology
   */
  async addTechnology(
    addTechnologyDto: AddTechnologyDto,
  ): Promise<ResponsePayload> {
    const newData = new this.technologyModel(addTechnologyDto);
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

  async insertManyTechnology(
    addTechnologysDto: AddTechnologyDto[],
    optionTechnologyDto: OptionTechnologyDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionTechnologyDto;
    if (deleteMany) {
      await this.technologyModel.deleteMany({});
    }
    try {
      const saveData = await this.technologyModel.insertMany(addTechnologysDto);

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
   * getAllTechnologys
   * getTechnologyById
   */

  async getAllTechnologys(
    filterTechnologyDto: FilterAndPaginationTechnologyDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterTechnologyDto;
    const { pagination } = filterTechnologyDto;
    const { sort } = filterTechnologyDto;
    const { select } = filterTechnologyDto;

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
    const aggregateStechnologyes = [];
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
      aggregateStechnologyes.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateStechnologyes.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStechnologyes.push({ $project: mSelect });
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

      aggregateStechnologyes.push(mPagination);

      aggregateStechnologyes.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.technologyModel.aggregate(
        aggregateStechnologyes,
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

  async getTechnologyById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.technologyModel.findById(id).select(select);
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
   * updateTechnologyById
   * updateMultipleTechnologyById
   */
  async updateTechnologyById(
    id: string,
    updateTechnologyDto: UpdateTechnologyDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.technologyModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.technologyModel.findByIdAndUpdate(id, {
        $set: updateTechnologyDto,
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

  async updateMultipleTechnologyById(
    ids: string[],
    updateTechnologyDto: UpdateTechnologyDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.technologyModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateTechnologyDto },
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
   * deleteTechnologyById
   * deleteMultipleTechnologyById
   */
  async deleteTechnologyById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.technologyModel.findById(id);
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
      await this.technologyModel.findByIdAndDelete(id);

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        await this.projectModel.updateMany(
          {},
          {
            $pull: { technology: new ObjectId(id) },
          },
        );

        await this.userModel.updateMany(
          {},
          {
            $pull: { technology: new ObjectId(id) },
          },
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

  async deleteMultipleTechnologyById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      // Remove Read Only Data
      const allData = await this.technologyModel.find({ _id: { $in: mIds } });
      const filteredIds = allData
        .filter((f) => f.readOnly !== true)
        .map((m) => m._id);
      await this.technologyModel.deleteMany({ _id: filteredIds });

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        await this.projectModel.updateMany(
          {},
          { $pull: { technology: { $in: mIds } } },
        );

        await this.userModel.updateMany(
          {},
          { $pull: { technology: { $in: mIds } } },
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
