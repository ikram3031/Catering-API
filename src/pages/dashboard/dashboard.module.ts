import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskSchema } from '../../schema/task.schema';
import { ProjectSchema } from '../../schema/project.schema';
import { UserSchema } from '../../schema/user.schema';
import { AdminSchema } from '../../schema/admin.schema';
import { ProjectCategorySchema } from '../../schema/project-category.schema';

@Module({
  imports: [
    // PassportModule.register({
    //   defaultStrategy: PASSPORT_ADMIN_TOKEN_TYPE,
    //   property: 'admin',
    //   session: false,
    // }),
    MongooseModule.forFeature([
      { name: 'Task', schema: TaskSchema },
      { name: 'Project', schema: ProjectSchema },
      { name: 'Admin', schema: AdminSchema },
      { name: 'User', schema: UserSchema },
      { name: 'ProjectCategory', schema: ProjectCategorySchema },
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
