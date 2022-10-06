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
import { ErrorCodes } from '../../enum/error-code.enum';
import {
  AddMenuDto,
  FilterAndPaginationMenuDto,
  OptionMenuDto,
  UpdateMenuDto,
} from '../../dto/menu.dto';
import { Cache } from 'cache-manager';
import { Menu } from '../../interfaces/common/menu.interface';
import { UtilsService } from '../../shared/utils/utils.service';
import { User } from '../../interfaces/user.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class MenuService {
  private logger = new Logger(MenuService.name);
  // Cache
  private readonly cacheAllData = 'getAllMenu';
  private readonly cacheDataCount = 'getCountMenu';

  constructor(
    @InjectModel('Menu')
    private readonly menuModel: Model<Menu>,
    @InjectModel('User')
    private readonly userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private utilsService: UtilsService,
  ) {}

  /**
   * ADD DATA
   * addMenu()
   * insertManyMenu()
   */
  async addMenu(user: User, addMenuDto: AddMenuDto): Promise<ResponsePayload> {
    try {
      const { date, type } = addMenuDto;
      const dateString = this.utilsService.getDateString(date);

      const data = await this.menuModel.findOne({
        date: dateString,
        type: type,
      });
      if (data) {
        return {
          success: false,
          message: `Data already added in this ${type}`,
          data: null,
        } as ResponsePayload;
      } else {
        const userData = await this.userModel.findById(user._id);
        const mData = {
          ...addMenuDto,
          ...{
            date: dateString,
            createdBy: {
              _id: userData._id,
              name: userData.name,
            },
          },
        };
        const newData = new this.menuModel(mData);

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

  async insertManyMenu(
    addMenusDto: AddMenuDto[],
    optionMenuDto: OptionMenuDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionMenuDto;
    if (deleteMany) {
      await this.menuModel.deleteMany({});
    }
    try {
      const saveData = await this.menuModel.insertMany(addMenusDto);
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
   * getAllMenus()
   * getMenusByDate()
   * getMenuById()
   */

  async getAllMenus(
    filterMenuDto: FilterAndPaginationMenuDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterMenuDto;
    const { pagination } = filterMenuDto;
    const { sort } = filterMenuDto;
    const { select } = filterMenuDto;

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
    const aggregateSmenues = [];
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
      aggregateSmenues.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSmenues.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSmenues.push({ $project: mSelect });
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

      aggregateSmenues.push(mPagination);

      aggregateSmenues.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.menuModel.aggregate(aggregateSmenues);
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

  async getMenusByDate(
    date: string,
    select?: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.menuModel.find({ date: date }).sort({ type: -1 });
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

  async getMenuById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.menuModel.findById(id).select(select);
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
   * updateMenuById()
   * updateMultipleMenuById()
   */
  async updateMenuById(
    user: User,
    id: string,
    updateMenuDto: UpdateMenuDto,
  ): Promise<ResponsePayload> {
    try {
      const userData = await this.userModel.findById(user._id);
      const mData = {
        ...updateMenuDto,
        ...{
          lastUpdatedBy: {
            _id: userData._id,
            name: userData.name,
          },
        },
      };

      await this.menuModel.findByIdAndUpdate(id, {
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

  async updateMultipleMenuById(
    ids: string[],
    updateMenuDto: UpdateMenuDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.menuModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateMenuDto },
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
   * deleteMenuById()
   * deleteMultipleMenuById()
   */
  async deleteMenuById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      await this.menuModel.findByIdAndDelete(id);

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

  async deleteMultipleMenuById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      // Remove Read Only Data
      const allData = await this.menuModel.find({ _id: { $in: mIds } });
      const filteredIds = allData
        .filter((f) => f['readOnly'] !== true)
        .map((m) => m._id);
      await this.menuModel.deleteMany({ _id: filteredIds });
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        const defaultData = await this.menuModel.findOne({
          readOnly: true,
        });
        // const resetData = {
        //   menu: {
        //     _id: defaultData._id,
        //     name: defaultData.name,
        //   },
        // };
        //
        // // Update Product
        // await this.projectModel.updateMany(
        //   { 'menu._id': { $in: mIds } },
        //   { $set: resetData },
        // );
        // await this.taskModel.updateMany(
        //   { 'menu._id': { $in: mIds } },
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
