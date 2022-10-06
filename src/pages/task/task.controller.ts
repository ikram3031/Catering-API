import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { AdminMetaPermissions } from '../../decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { AdminPermissionGuard } from '../../guards/admin-permission.guard';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { TaskService } from './task.service';
import {
  AddTaskDto,
  AddTaskListDto,
  FilterAndPaginationTaskDto,
  OptionTaskDto,
  UpdateTaskDto,
} from '../../dto/task.dto';

import { Admin } from '../../interfaces/admin.interface';
import { UserJwtAuthGuard } from '../../guards/user-jwt-auth.guard';
import { GetTokenUser } from '../../decorator/get-token-user.decorator';
import { User } from '../../interfaces/user.interface';
import { Task } from '../../interfaces/task.interface';
import { UtilsService } from '../../shared/utils/utils.service';

@Controller('task')
export class TaskController {
  private logger = new Logger(TaskController.name);

  constructor(
    private taskService: TaskService,
    private utilsService: UtilsService,
  ) {}

  /**
   * addTask
   * insertManyTask
   */
  @Post('/add')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async addTask(
    @Body()
    addTaskDto: AddTaskDto,
    @GetTokenUser() admin: Admin,
  ): Promise<ResponsePayload> {
    return await this.taskService.addTask(admin, addTaskDto);
  }

  @Post('/insert-many')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async insertManyTask(
    @Body()
    body: {
      data: AddTaskDto[];
      option: OptionTaskDto;
    },
  ): Promise<ResponsePayload> {
    return await this.taskService.insertManyTask(body.data, body.option);
  }

  /**
   * getAllTasks
   * getTaskById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  async getAllTasks(
    @Body() filterTaskDto: FilterAndPaginationTaskDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.taskService.getAllTasks(filterTaskDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  async getTaskById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.taskService.getTaskById(id, select);
  }

  /**
   * updateTaskById
   * updateMultipleTaskById
   */
  @Version(VERSION_NEUTRAL)
  @Put('/update-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateTaskById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<ResponsePayload> {
    return await this.taskService.updateTaskById(id, updateTaskDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.EDIT)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleTaskById(
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<ResponsePayload> {
    return await this.taskService.updateMultipleTaskById(
      updateTaskDto.ids,
      updateTaskDto,
    );
  }

  /**
   * deleteTaskById
   * deleteMultipleTaskById
   */
  @Version(VERSION_NEUTRAL)
  @Delete('/delete-data/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteTaskById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.taskService.deleteTaskById(id, Boolean(checkUsage));
  }

  @Version(VERSION_NEUTRAL)
  @Post('/delete-multiple-data-by-id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteMultipleTaskById(
    @Body() data: { ids: string[] },
    @Query('checkUsage') checkUsage: boolean,
  ): Promise<ResponsePayload> {
    return await this.taskService.deleteMultipleTaskById(
      data.ids,
      Boolean(checkUsage),
    );
  }

  /**
   * addTask
   * insertManyTask
   */
  @Post('/add-list-item-admin')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addTaskList(
    @Body()
    addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    return await this.taskService.addTaskList(addTaskListDto);
  }

  @Put('/update-list-item-admin')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateTaskList(
    @Body()
    addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    return await this.taskService.updateTaskList(addTaskListDto);
  }

  @Put('/update-list-multi-items-admin')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async updateMultipleTaskList(
    @Body()
      addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    return await this.taskService.updateMultipleTaskList(addTaskListDto);
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-list-data/:taskId/:id')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.DELETE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async deleteTaskList(
    @Param('taskId', MongoIdValidationPipe) taskId: string,
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.taskService.deleteTaskList(taskId, id);
  }

  /**
   * USERS TASK
   * getTaskByUser()
   * addTaskListByUser()
   * deleteTaskListByUser()
   */
  @Post('/get-task-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async getTaskByUser(
    @GetTokenUser() user: User,
    @Body() filterTaskDto: FilterAndPaginationTaskDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return await this.taskService.getTaskByUser(
      user,
      filterTaskDto,
      searchString,
    );
  }

  @Post('/add-list-item-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async addTaskListByUser(
    @GetTokenUser() user: User,
    @Body()
    addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    return await this.taskService.addTaskListByUser(user, addTaskListDto);
  }

  @Version(VERSION_NEUTRAL)
  @Put('/update-task-user/:id')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async updateTaskByUser(
    @GetTokenUser() user: User,
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<ResponsePayload> {
    return await this.taskService.updateTaskById(id, updateTaskDto);
  }

  @Put('/update-list-item-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async updateTaskListByUser(
    @GetTokenUser() user: User,
    @Body()
    addTaskListDto: AddTaskListDto,
  ): Promise<ResponsePayload> {
    return await this.taskService.updateTaskListByUser(user, addTaskListDto);
  }

  @Version(VERSION_NEUTRAL)
  @Delete('/delete-list-data-user/:taskId/:id')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async deleteTaskListByUser(
    @GetTokenUser() user: User,
    @Param('taskId', MongoIdValidationPipe) taskId: string,
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<ResponsePayload> {
    return await this.taskService.deleteTaskListByUser(user, taskId, id);
  }

  /**
   * REPORTS
   * getTaskReportByUser(ADMIN)
   * getTaskReportByUser(USER)
   */
  @Post('/get-user-task-report-by-admin')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.GET)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getTaskReportByUser(
    @Body() filterTaskDto: FilterAndPaginationTaskDto,
    @Query('q') searchString: string,
    @Query('userId') userId: string,
  ): Promise<ResponsePayload> {
    const user = {
      _id: userId,
    };
    const data = await this.taskService.getTaskReportByUser(
      user,
      filterTaskDto,
      searchString,
    );

    if (userId) {
      const tasks = data.data as Task[];
      tasks.forEach((task) => {
        if (task.list && task.list.length) {
          task.expectedList = task.list;
          task.list = task.list.filter(
            (f) => f.user.toString() === userId && f.status === 'Approved',
          );
        }

        task.totalActualTime = this.utilsService.getTotalTime(
          task.list,
          'actualTimeInMinute',
        );
        task.totalExpectedTime = this.utilsService.getTotalTime(
          task.expectedList,
          'expectedTimeInMinute',
        );
      });

      return {
        success: data.success,
        count: data.count,
        data: tasks,
        reports: {
          expectedEndTime: this.utilsService.getTotalKpiTime(
            tasks,
            'totalExpectedTime',
          ),
          actualEndTime: this.utilsService.getTotalKpiTime(
            tasks,
            'totalActualTime',
          ),
        },
      } as ResponsePayload;
    } else {
      return data;
    }
  }

  @Post('/get-user-task-report-by-user')
  @UseGuards(UserJwtAuthGuard)
  @UsePipes(ValidationPipe)
  async getTaskReportByLoggedInUser(
    @GetTokenUser() user: User,
    @Body() filterTaskDto: FilterAndPaginationTaskDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    const data = await this.taskService.getTaskReportByUser(
      user,
      filterTaskDto,
      searchString,
    );

    if (user._id) {
      const tasks = data.data as Task[];
      tasks.forEach((task) => {
        if (task.list && task.list.length) {
          task.expectedList = task.list;
          task.list = task.list.filter(
            (f) => f.user.toString() === user._id && f.status === 'Approved',
          );
        }

        task.totalActualTime = this.utilsService.getTotalTime(
          task.list,
          'actualTimeInMinute',
        );
        task.totalExpectedTime = this.utilsService.getTotalTime(
          task.expectedList,
          'expectedTimeInMinute',
        );
      });

      return {
        success: data.success,
        count: data.count,
        data: tasks,
        reports: {
          expectedEndTime: this.utilsService.getTotalKpiTime(
            tasks,
            'totalExpectedTime',
          ),
          actualEndTime: this.utilsService.getTotalKpiTime(
            tasks,
            'totalActualTime',
          ),
        },
      } as ResponsePayload;
    } else {
      return data;
    }
  }
}
