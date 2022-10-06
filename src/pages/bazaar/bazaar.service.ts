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
  AddBazaarDto,
  FilterAndPaginationBazaarDto,
  OptionBazaarDto,
  UpdateBazaarDto,
} from '../../dto/bazaar.dto';
import { Cache } from 'cache-manager';
import { UtilsService } from '../../shared/utils/utils.service';
import { User } from '../../interfaces/user.interface';
import { Bazaar } from '../../interfaces/common/bazaar.interface';
import { ErrorCodes } from '../../enum/error-code.enum';

const ObjectId = Types.ObjectId;

@Injectable()
export class BazaarService {
  private logger = new Logger(BazaarService.name);
  // Cache
  private readonly cacheAllData = 'getAllBazaar';
  private readonly cacheDataCount = 'getCountBazaar';

  constructor(
    @InjectModel('Bazaar')
    private readonly bazaarModel: Model<Bazaar>,
    @InjectModel('User')
    private readonly userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private utilsService: UtilsService,
  ) {}

  /**
   * ADD DATA
   * addBazaar()
   * insertManyBazaar()
   */
  async addBazaar(
    user: User,
    addBazaarDto: AddBazaarDto,
  ): Promise<ResponsePayload> {
    try {
      const { date } = addBazaarDto;
      const dateString = this.utilsService.getDateString(date);

      const data = await this.bazaarModel.findOne({
        date: dateString,
      });
      if (data) {
        return {
          success: false,
          message: `Data already added in this day`,
          data: null,
        } as ResponsePayload;
      } else {
        const userData = await this.userModel.findById(user._id);
        const mData = {
          ...addBazaarDto,
          ...{
            month: this.utilsService.getDateMonth(false, dateString),
            date: dateString,
            createdBy: {
              _id: userData._id,
              name: userData.name,
            },
          },
        };
        const newData = new this.bazaarModel(mData);

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
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyBazaar(
    addBazaarsDto: AddBazaarDto[],
    optionBazaarDto: OptionBazaarDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionBazaarDto;
    if (deleteMany) {
      await this.bazaarModel.deleteMany({});
    }
    try {
      const saveData = await this.bazaarModel.insertMany(addBazaarsDto);
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
   * getAllBazaars()
   * getBazaarsByDate()
   * getBazaarById()
   */

  async getAllBazaars(
    filterBazaarDto: FilterAndPaginationBazaarDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterBazaarDto;
    const { pagination } = filterBazaarDto;
    const { sort } = filterBazaarDto;
    const { select } = filterBazaarDto;

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
    const aggregateSbazaares = [];
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
      aggregateSbazaares.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSbazaares.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSbazaares.push({ $project: mSelect });
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

      aggregateSbazaares.push(mPagination);

      aggregateSbazaares.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.bazaarModel.aggregate(
        aggregateSbazaares,
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

  async getBazaarsByDate(
    date: string,
    select?: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.bazaarModel
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

  async getBazaarById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.bazaarModel.findById(id).select(select);
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
   * updateBazaarById()
   * updateMultipleBazaarById()
   */
  async updateBazaarById(
    user: User,
    id: string,
    updateBazaarDto: UpdateBazaarDto,
  ): Promise<ResponsePayload> {
    try {
      const dateString = new Date();
      const userData = await this.userModel.findById(user._id);
      const mData = {
        ...updateBazaarDto,
        ...{
          month: this.utilsService.getDateMonth(false, dateString),
          lastUpdatedBy: {
            _id: userData._id,
            name: userData.name,
          },
        },
      };

      await this.bazaarModel.findByIdAndUpdate(id, {
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

  async updateMultipleBazaarById(
    ids: string[],
    updateBazaarDto: UpdateBazaarDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.bazaarModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateBazaarDto },
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
   * deleteBazaarById()
   * deleteMultipleBazaarById()
   */
  async deleteBazaarById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      await this.bazaarModel.findByIdAndDelete(id);

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

  async deleteMultipleBazaarById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      // Remove Read Only Data
      const allData = await this.bazaarModel.find({ _id: { $in: mIds } });
      const filteredIds = allData
        .filter((f) => f['readOnly'] !== true)
        .map((m) => m._id);
      await this.bazaarModel.deleteMany({ _id: filteredIds });
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        const defaultData = await this.bazaarModel.findOne({
          readOnly: true,
        });
        // const resetData = {
        //   bazaar: {
        //     _id: defaultData._id,
        //     name: defaultData.name,
        //   },
        // };
        //
        // // Update Product
        // await this.projectModel.updateMany(
        //   { 'bazaar._id': { $in: mIds } },
        //   { $set: resetData },
        // );
        // await this.taskModel.updateMany(
        //   { 'bazaar._id': { $in: mIds } },
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
