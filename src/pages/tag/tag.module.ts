import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TagSchema } from '../../schema/tag.schema';
import { ProjectSchema } from '../../schema/project.schema';
import { TaskSchema } from '../../schema/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Tag', schema: TagSchema },
      { name: 'Project', schema: ProjectSchema },
      { name: 'Task', schema: TaskSchema },
    ]),
  ],
  providers: [TagService],
  controllers: [TagController],
})
export class TagModule {}
