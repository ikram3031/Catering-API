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
import { ProjectCategory } from '../../interfaces/project-category.interface';
import {
  AddProjectCategoryDto,
  FilterAndPaginationProjectCategoryDto,
  OptionProjectCategoryDto,
  UpdateProjectCategoryDto,
} from '../../dto/project-category.dto';
import { Project } from '../../interfaces/project.interface';
import { Cache } from 'cache-manager';

const ObjectId = Types.ObjectId;

@Injectable()
export class ProjectCategoryService {
  private logger = new Logger(ProjectCategoryService.name);
  // Cache
  private readonly cacheAllData = 'getAllProjectCategory';
  private readonly cacheDataCount = 'getCountProjectCategory';

  constructor(
    @InjectModel('ProjectCategory')
    private readonly projectCategoryModel: Model<ProjectCategory>,
    @InjectModel('Project') private readonly projectModel: Model<Project>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * addProjectCategory
   * insertManyProjectCategory
   */
  async addProjectCategory(
    addProjectCategoryDto: AddProjectCategoryDto,
  ): Promise<ResponsePayload> {
    const newData = new this.projectCategoryModel(addProjectCategoryDto);
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

  async insertManyProjectCategory(
    addProjectCategorysDto: AddProjectCategoryDto[],
    optionProjectCategoryDto: OptionProjectCategoryDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionProjectCategoryDto;
    if (deleteMany) {
      await this.projectCategoryModel.deleteMany({});
    }
    try {
      const saveData = await this.projectCategoryModel.insertMany(
        addProjectCategorysDto,
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
   * getAllProjectCategorys
   * getProjectCategoryById
   */

  async getAllProjectCategorys(
    filterProjectCategoryDto: FilterAndPaginationProjectCategoryDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterProjectCategoryDto;
    const { pagination } = filterProjectCategoryDto;
    const { sort } = filterProjectCategoryDto;
    const { select } = filterProjectCategoryDto;

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
    const aggregateSprojectCategoryes = [];
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
      aggregateSprojectCategoryes.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSprojectCategoryes.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSprojectCategoryes.push({ $project: mSelect });
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

      aggregateSprojectCategoryes.push(mPagination);

      aggregateSprojectCategoryes.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.projectCategoryModel.aggregate(
        aggregateSprojectCategoryes,
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

  async getProjectCategoryById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.projectCategoryModel.findById(id).select(select);
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
   * updateProjectCategoryById
   * updateMultipleProjectCategoryById
   */
  async updateProjectCategoryById(
    id: string,
    updateProjectCategoryDto: UpdateProjectCategoryDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.projectCategoryModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.projectCategoryModel.findByIdAndUpdate(id, {
        $set: updateProjectCategoryDto,
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

  async updateMultipleProjectCategoryById(
    ids: string[],
    updateProjectCategoryDto: UpdateProjectCategoryDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.projectCategoryModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateProjectCategoryDto },
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
   * deleteProjectCategoryById
   * deleteMultipleProjectCategoryById
   */
  async deleteProjectCategoryById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.projectCategoryModel.findById(id);
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
      await this.projectCategoryModel.findByIdAndDelete(id);

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        const defaultData = await this.projectCategoryModel.findOne({
          readOnly: true,
        });
        const resetData = {
          category: {
            _id: defaultData._id,
            name: defaultData.name,
          },
        };
        // Update Deleted Data
        await this.projectModel.updateMany(
          { 'category._id': new ObjectId(id) },
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

  async deleteMultipleProjectCategoryById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      // Remove Read Only Data
      const allData = await this.projectCategoryModel.find({
        _id: { $in: mIds },
      });
      const filteredIds = allData
        .filter((f) => f.readOnly !== true)
        .map((m) => m._id);
      await this.projectCategoryModel.deleteMany({ _id: filteredIds });

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        const defaultData = await this.projectCategoryModel.findOne({
          readOnly: true,
        });
        const resetData = {
          category: {
            _id: defaultData._id,
            name: defaultData.name,
          },
        };

        // Update Product
        await this.projectModel.updateMany(
          { 'category._id': { $in: mIds } },
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
