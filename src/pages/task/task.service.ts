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
import { Task } from '../../interfaces/task.interface';
import {
  AddTaskDto,
  AddTaskListDto,
  FilterAndPaginationTaskDto,
  OptionTaskDto,
  UpdateTaskDto,
} from '../../dto/task.dto';
import { Admin } from '../../interfaces/admin.interface';
import { User } from '../../interfaces/user.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);

  constructor(
    @InjectModel('Task')
    private readonly taskModel: Model<Task>,
    @InjectModel('Admin')
    private readonly adminModel: Model<Admin>,
    @InjectModel('User')
    private readonly userModel: Model<User>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * addTask
   * insertManyTask
   */
  async addTask(
    admin: Admin,
    addTaskDto: AddTaskDto,
  ): Promise<ResponsePayload> {
    try {
      const adminData = await this.adminModel
        .findById(admin._id)
        .select('name');

      const mData = {
        ...addTaskDto,
        ...{
          assignBy: {
            _id: adminData._id,
            name: adminData.name,
          },
        },
      };

      const newData = new this.taskModel(mData);

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
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyTask(
    addTasksDto: AddTaskDto[],
    optionTaskDto: OptionTaskDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionTaskDto;
    if (deleteMany) {
      await this.taskModel.deleteMany({});
    }
    try {
      const saveData = await this.taskModel.insertMany(addTasksDto);
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
   * getAllTasks
   * getTaskById
   */

  async getAllTasks(
    filterTaskDto: FilterAndPaginationTaskDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterTaskDto;
    const { pagination } = filterTaskDto;
    const { sort } = filterTaskDto;
    const { select } = filterTaskDto;

    // Essential Variables
    const aggregateStaskes = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      if (filter['project._id']) {
        filter['project._id'] = new ObjectId(filter['project._id']);
      }
      if (filter['assignTo._id']) {
        filter['assignTo._id'] = new ObjectId(filter['assignTo._id']);
      }
      if (filter['assignBy._id']) {
        filter['assignBy._id'] = new ObjectId(filter['assignBy._id']);
      }
      if (filter['tag._id']) {
        filter['tag._id'] = new ObjectId(filter['tag._id']);
      }
      if (filter.assignDate && typeof filter.assignDate === 'object') {
        filter.assignDate['$gte'] = new Date(filter.assignDate['$gte']);
        if (filter.assignDate['$lte']) {
          filter.assignDate['$lte'] = new Date(filter.assignDate['$lte']);
        }
      }
      mFilter = { ...mFilter, ...filter };
    }

    if (searchQuery) {
      mFilter = { ...mFilter, ...{ title: new RegExp(searchQuery, 'i') } };
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

    // Add Fields
    aggregateStaskes.push({
      $addFields: {
        month: {
          $month: {
            $toDate: '$dueDate',
          },
        },
      },
    });

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateStaskes.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateStaskes.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStaskes.push({ $project: mSelect });
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
            metadata: [{ $count: 'total', $sum: '$expectedTimeInMinute' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateStaskes.push(mPagination);

      aggregateStaskes.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
          time: { $arrayElemAt: ['$metadata.expectedTimeInMinute', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.taskModel.aggregate(aggregateStaskes);
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
        throw new BadRequestException('Error! Taskion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getTaskById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.taskModel.findById(id).select(select);
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
   * updateTaskById
   * updateMultipleTaskById
   */
  async updateTaskById(
    id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.taskModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.taskModel.findByIdAndUpdate(id, {
        $set: updateTaskDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleTaskById(
    ids: string[],
    updateTaskDto: UpdateTaskDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.taskModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateTaskDto },
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
   * deleteTaskById
   * deleteMultipleTaskById
   */
  async deleteTaskById(
    id: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.taskModel.findById(id);
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
      await this.taskModel.findByIdAndDelete(id);
      // Reset Product Category Reference
      // if (checkUsage) {
      //   const defaultData = await this.taskModel.findOne({
      //     readOnly: true,
      //   });
      //   const resetData = {
      //     task: {
      //       _id: defaultData._id,
      //       name: defaultData.name,
      //     },
      //   };
      //   // Update Deleted Data
      //   await this.userModel.updateMany(
      //     { 'task._id': new ObjectId(id) },
      //     { $set: resetData },
      //   );
      // }

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleTaskById(
    ids: string[],
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.taskModel.deleteMany({ _id: mIds });
      // Reset Product Category Reference
      // if (checkUsage) {
      //   const defaultData = await this.taskModel.findOne({
      //     readOnly: true,
      //   });
      //   const resetData = {
      //     task: {
      //       _id: defaultData._id,
      //       name: defaultData.name,
      //     },
      //   };
      //
      //   // Update Product
      //   await this.userModel.updateMany(
      //     { 'task._id': { $in: mIds } },
      //     { $set: resetData },
      //   );
      // }
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * ADDITIONAL METHODS
   * addTaskList()
   * updateTaskList()
   * deleteTaskList()
   */
  async addTaskList(addTaskListDto: AddTaskListDto): Promise<ResponsePayload> {
    try {
      const { taskId } = addTaskListDto;

      await this.taskModel.updateOne(
        { _id: taskId },
        { $push: { list: { $each: [addTaskListDto], $position: 0 } } },
      );

      return {
        success: true,
        message: 'Data Added Success',
        data: null,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateTaskList(
    addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    try {
      const { taskId } = addTaskListDto;
      const { _id } = addTaskListDto;

      // For Update Object Array
      const obj: any = {};
      if (addTaskListDto.name) {
        obj['list.$.name'] = addTaskListDto.name;
      }
      if (addTaskListDto.status) {
        obj['list.$.status'] = addTaskListDto.status;
      }

      if (
        addTaskListDto.checked !== null &&
        addTaskListDto.checked !== undefined
      ) {
        obj['list.$.checked'] = addTaskListDto.checked;
      }
      if (addTaskListDto.expectedTimeInMinute) {
        obj['list.$.expectedTimeInMinute'] =
          addTaskListDto.expectedTimeInMinute;
      }

      if (addTaskListDto.actualTimeInMinute) {
        obj['list.$.actualTimeInMinute'] = addTaskListDto.actualTimeInMinute;
      }
      if (addTaskListDto.user) {
        obj['list.$.user'] = addTaskListDto.user;
      }

      if (addTaskListDto.endDate) {
        obj['list.$.endDate'] = addTaskListDto.endDate;
      }

      if (addTaskListDto.startDate) {
        obj['list.$.startDate'] = addTaskListDto.startDate;
      }

      obj['list.$.note'] = addTaskListDto.note ? addTaskListDto.note : null;

      await this.taskModel.updateOne(
        { _id: taskId, 'list._id': new ObjectId(_id) },
        { $set: obj },
      );

      return {
        success: true,
        message: 'Data Updated Success',
        data: null,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateMultipleTaskList(
    addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    try {
      const { taskId } = addTaskListDto;
      const { ids } = addTaskListDto;

      if (ids && ids.length) {
        for (const _id of ids) {
          // For Update Object Array
          const obj: any = {};
          if (addTaskListDto.status) {
            obj['list.$.status'] = addTaskListDto.status;
          }

          if (
            addTaskListDto.checked !== null &&
            addTaskListDto.checked !== undefined
          ) {
            obj['list.$.checked'] = addTaskListDto.checked;
          }
          await this.taskModel.updateOne(
            { _id: taskId, 'list._id': new ObjectId(_id) },
            { $set: obj },
          );
        }
        return {
          success: true,
          message: 'Data Updated Success',
          data: null,
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'No Data Updated',
          data: null,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteTaskList(taskId: string, id: string): Promise<ResponsePayload> {
    try {
      await this.taskModel.updateOne(
        { _id: taskId },
        { $pull: { list: { _id: new ObjectId(id) } } },
      );

      return {
        success: true,
        message: 'Data Added Success',
        data: null,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * USERS TASK
   * getTaskByUser()
   * addTaskListByUser()
   * updateTaskListByUser()
   */
  async getTaskByUser(
    user: User,
    filterTaskDto: FilterAndPaginationTaskDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      let { filter } = filterTaskDto;
      if (filter) {
        filter = { ...filter, ...{ 'assignTo._id': new ObjectId(user._id) } };
      }
      filterTaskDto.filter = filter;
      return this.getAllTasks(filterTaskDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async addTaskListByUser(
    user: User,
    addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    try {
      addTaskListDto.user = user._id;
      return this.addTaskList(addTaskListDto);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateTaskListByUser(
    user: User,
    addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    try {
      // addTaskListDto.user = user._id;
      return this.updateTaskList(addTaskListDto);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteTaskListByUser(
    user: User,
    taskId: string,
    id: string,
  ): Promise<ResponsePayload> {
    try {
      // addTaskListDto.user = user._id;
      return this.deleteTaskList(taskId, id);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * TASK REPORTS
   * getTaskReportByUser()
   */
  async getTaskReportByUser(
    user: User,
    filterTaskDto: FilterAndPaginationTaskDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      // Modify Filter
      let { filter } = filterTaskDto;
      if (filter) {
        filter = { ...filter, ...{ 'assignTo._id': new ObjectId(user._id) } };
      }
      filterTaskDto.filter = filter;
      filterTaskDto.pagination = null;

      return this.getAllTasks(filterTaskDto, null);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
