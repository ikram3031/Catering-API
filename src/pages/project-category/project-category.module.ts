import { Module } from '@nestjs/common';
import { ProjectCategoryService } from './project-category.service';
import { ProjectCategoryController } from './project-category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectCategorySchema } from '../../schema/project-category.schema';
import { ProjectSchema } from '../../schema/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ProjectCategory', schema: ProjectCategorySchema },
      { name: 'Project', schema: ProjectSchema },
    ]),
  ],
  providers: [ProjectCategoryService],
  controllers: [ProjectCategoryController],
})
export class ProjectCategoryModule {}
