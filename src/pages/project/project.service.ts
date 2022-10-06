import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import { User } from '../../interfaces/user.interface';
import { Project } from '../../interfaces/project.interface';
import {
  AddProjectDto,
  FilterAndPaginationProjectDto,
  OptionProjectDto,
  UpdateProjectDto,
} from '../../dto/project.dto';

const ObjectId = Types.ObjectId;

@Injectable()
export class ProjectService {
  private logger = new Logger(ProjectService.name);
  // Cache
  private readonly cacheAllData = 'getAllProject';
  private readonly cacheDataCount = 'getCountProject';

  constructor(
    @InjectModel('Project')
    private readonly projectModel: Model<Project>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * addProject
   * insertManyProject
   */
  async addProject(addProjectDto: AddProjectDto): Promise<ResponsePayload> {
    const newData = new this.projectModel(addProjectDto);
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

  async insertManyProject(
    addProjectsDto: AddProjectDto[],
    optionProjectDto: OptionProjectDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionProjectDto;
    if (deleteMany) {
      await this.projectModel.deleteMany({});
    }
    try {
      const saveData = await this.projectModel.insertMany(addProjectsDto);

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
   * getAllProjects
   * getProjectById
   */

  async getAllProjects(
    filterProjectDto: FilterAndPaginationProjectDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterProjectDto;
    const { pagination } = filterProjectDto;
    const { sort } = filterProjectDto;
    const { select } = filterProjectDto;

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

    // Modify Id as Object ID
    if (filter && filter['category._id']) {
      filter['category._id'] = new ObjectId(filter['category._id']);
    }

    if (filter && filter['tag._id']) {
      filter['tag._id'] = new ObjectId(filter['tag._id']);
    }
    // Essential Variables
    const aggregateSprojectes = [];
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
      aggregateSprojectes.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSprojectes.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSprojectes.push({ $project: mSelect });
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

      aggregateSprojectes.push(mPagination);

      aggregateSprojectes.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.projectModel.aggregate(
        aggregateSprojectes,
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

  async getProjectById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.projectModel.findById(id).select(select);
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
   * updateProjectById
   * updateMultipleProjectById
   */
  async updateProjectById(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.projectModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.projectModel.findByIdAndUpdate(id, {
        $set: updateProjectDto,
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

  async updateMultipleProjectById(
    ids: string[],
    updateProjectDto: UpdateProjectDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.projectModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateProjectDto },
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
   * deleteProjectById
   * deleteMultipleProjectById
   */
  async deleteProjectById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.projectModel.findById(id);
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
      await this.projectModel.findByIdAndDelete(id);

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        const defaultData = await this.projectModel.findOne({
          readOnly: true,
        });
        const resetData = {
          project: {
            _id: defaultData._id,
            name: defaultData.name,
          },
        };
        // Update Deleted Data
        await this.userModel.updateMany(
          { 'project._id': new ObjectId(id) },
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

  async deleteMultipleProjectById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      // Remove Read Only Data
      const allData = await this.projectModel.find({ _id: { $in: mIds } });
      const filteredIds = allData
        .filter((f) => f.readOnly !== true)
        .map((m) => m._id);
      await this.projectModel.deleteMany({ _id: filteredIds });

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      // Reset Product Category Reference
      if (checkUsage) {
        console.log('Do Something...');
        // const defaultData = await this.projectModel.findOne({
        //   readOnly: true,
        // });
        // const resetData = {
        //   project: {
        //     _id: defaultData._id,
        //     name: defaultData.name,
        //   },
        // };
        //
        // // Update Product
        // await this.userModel.updateMany(
        //   { 'project._id': { $in: mIds } },
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
