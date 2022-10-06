import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskSchema } from '../../schema/task.schema';
import { ProjectSchema } from '../../schema/project.schema';
import { UserSchema } from '../../schema/user.schema';
import { AdminSchema } from '../../schema/admin.schema';

@Module({
  imports: [
    // PassportModule.register({
    //   defaultStrategy: PASSPORT_ADMIN_TOKEN_TYPE,
    //   property: 'admin',
    //   session: false,
    // }),
    // PassportModule.register({
    //   defaultStrategy: PASSPORT_USER_TOKEN_TYPE,
    //   property: 'user',
    //   session: false,
    // }),
    MongooseModule.forFeature([
      { name: 'Task', schema: TaskSchema },
      { name: 'Project', schema: ProjectSchema },
      { name: 'Admin', schema: AdminSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
