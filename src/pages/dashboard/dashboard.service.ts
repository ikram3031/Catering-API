import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../../shared/utils/utils.service';
import { Task } from '../../interfaces/task.interface';
import { Admin } from '../../interfaces/admin.interface';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { Project } from '../../interfaces/project.interface';
import { User } from '../../interfaces/user.interface';
import { ProjectCategory } from '../../interfaces/project-category.interface';
import { FilterAndPaginationUserDto } from '../../dto/user.dto';
import { ErrorCodes } from '../../enum/error-code.enum';
import { FilterAndPaginationProjectDto } from '../../dto/project.dto';

const ObjectId = Types.ObjectId;

@Injectable()
export class DashboardService {
  private logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel('Task')
    private readonly taskModel: Model<Task>,
    @InjectModel('Project')
    private readonly projectModel: Model<Project>,
    @InjectModel('Admin')
    private readonly adminModel: Model<Admin>,
    @InjectModel('User')
    private readonly userModel: Model<User>,
    @InjectModel('ProjectCategory')
    private readonly projectCategoryModel: Model<ProjectCategory>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * getAdminDashboard()
   * getResources()
   * getUserDashboard()
   * getAllUsers()
   */
  async getAdminDashboard(): Promise<ResponsePayload> {
    try {
      const countProject = await this.projectModel.countDocuments();
      const pendingTasks = await this.taskModel
        .find({ isDone: false })
        .select('assignTo');

      // Assign Users
      const assignUsers = [];
      (pendingTasks as Task[]).forEach((task) => {
        task.assignTo.forEach((user) => {
          const userId = user._id.toString();
          if (assignUsers.indexOf(userId) === -1) {
            assignUsers.push(userId);
          }
        });
      });

      const countUser = await this.userModel.countDocuments();
      const countAdmin = await this.adminModel.countDocuments();
      const countProjectCategory =
        await this.projectCategoryModel.countDocuments();

      const data = {
        projects: countProject,
        pendingTasks: pendingTasks ? pendingTasks.length : 0,
        freeResources: countUser - assignUsers.length,
        users: countUser,
        assignUsers: assignUsers.length,
        admins: countAdmin,
        projectCategories: countProjectCategory,
      };

      return {
        success: true,
        message: 'Data Retrieve Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getResources(
    isFree: string,
    filterUserDto: FilterAndPaginationUserDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      const pendingTasks = await this.taskModel
        .find({ isDone: false })
        .select('assignTo');

      // Assign Users
      const assignUsers = [];
      (pendingTasks as Task[]).forEach((task) => {
        task.assignTo.forEach((user) => {
          const userId = user._id.toString();
          if (assignUsers.indexOf(userId) === -1) {
            assignUsers.push(userId);
          }
        });
      });

      // Logic Here
      if (isFree && isFree === 'true') {
        const users = await this.userModel
          .find({ _id: { $nin: assignUsers } })
          .select('_id');

        const freeUsers = users.map((m) => new ObjectId(m._id));
        let { filter } = filterUserDto;

        // Modify Filter
        filter = { ...{ _id: { $in: freeUsers } }, ...filter };
        filterUserDto.filter = filter;
        return this.getAllUsers(filterUserDto, searchQuery);
      } else {
        const mAssignUsers = assignUsers.map((m) => new ObjectId(m));
        let { filter } = filterUserDto;

        // Modify Filter
        filter = { ...{ _id: { $in: mAssignUsers } }, ...filter };
        filterUserDto.filter = filter;

        return this.getAllUsers(filterUserDto, searchQuery);
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserDashboard(user: User): Promise<ResponsePayload> {
    try {
      // const pendingTasksCount = await this.taskModel.countDocuments({
      //   'assignTo._id': new ObjectId(user._id),
      //   isDone: false,
      // });

      const pendingTasks = await this.taskModel
        .find({
          'assignTo._id': new ObjectId(user._id),
          isDone: false,
        })
        .select('project');

      const completedTasksCount = await this.taskModel.countDocuments({
        'assignTo._id': new ObjectId(user._id),
        isDone: true,
      });

      // Pending Projects
      const pendingProjects: any = [];
      (pendingTasks as Task[]).forEach((task) => {
        const projectId = task.project._id.toString();
        if (pendingProjects.indexOf(projectId) === -1) {
          pendingProjects.push(projectId);
        }
      });

      const data = {
        projects: pendingProjects ? pendingProjects.length : 0,
        pendingTasks: pendingTasks ? pendingTasks.length : 0,
        completeTasks: completedTasksCount,
      };

      return {
        success: true,
        message: 'Data Retrieve Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserProjects(
    user: User,
    filterProjectDto: FilterAndPaginationProjectDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      const pendingTasks = await this.taskModel
        .find({
          'assignTo._id': new ObjectId(user._id),
        })
        .select('project');

      // console.log('pendingTasks', pendingTasks);

      // Projects
      const projects: any = [];
      (pendingTasks as Task[]).forEach((task) => {
        const projectId = task.project._id.toString();
        if (projects.indexOf(projectId) === -1) {
          projects.push(projectId);
        }
      });

      // Logic Here
      if (projects && projects.length) {
        const projectIds = projects.map((m) => new ObjectId(m));

        let { filter } = filterProjectDto;

        // Modify Filter
        filter = { ...{ _id: { $in: projectIds } }, ...filter };
        filterProjectDto.filter = filter;
        return this.getAllProjects(filterProjectDto, searchQuery);
      } else {
        return {
          success: true,
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * USERS LIST
   * PROJECT LIST
   */
  async getAllUsers(
    filterUserDto: FilterAndPaginationUserDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterUserDto;
    const { pagination } = filterUserDto;
    const { sort } = filterUserDto;
    const { select } = filterUserDto;

    // Modify Id as Object ID
    if (filter && filter['designation._id']) {
      filter['designation._id'] = new ObjectId(filter['designation._id']);
    }

    if (filter && filter['userType._id']) {
      filter['userType._id'] = new ObjectId(filter['userType._id']);
    }

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { username: { $regex: searchQuery, $options: 'i' } },
              { phoneNo: { $regex: searchQuery, $options: 'i' } },
            ],
          },
        ],
      };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { createdAt: -1 };
    }

    // Select
    if (select) {
      // Remove Sensitive Select
      delete select.password;
      mSelect = { ...mSelect, ...select };
    } else {
      mSelect = { password: 0 };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      // Remove Sensitive Select
      delete mSelect['password'];
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
              { $project: { password: 0 } },
            ],
          },
        };
      }

      aggregateStages.push(mPagination);

      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.userModel.aggregate(aggregateStages);
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
        throw new BadRequestException('Error! Projection mismatch');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getAllProjects(
    filterProjectDto: FilterAndPaginationProjectDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterProjectDto;
    const { pagination } = filterProjectDto;
    const { sort } = filterProjectDto;
    const { select } = filterProjectDto;

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
}
