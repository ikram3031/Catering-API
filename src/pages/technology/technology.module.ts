import { Module } from '@nestjs/common';
import { TechnologyService } from './technology.service';
import { TechnologyController } from './technology.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TechnologySchema } from '../../schema/technology.schema';
import { UserSchema } from '../../schema/user.schema';
import { ProjectSchema } from '../../schema/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Technology', schema: TechnologySchema },
      { name: 'User', schema: UserSchema },
      { name: 'Project', schema: ProjectSchema },
    ]),
  ],
  providers: [TechnologyService],
  controllers: [TechnologyController],
})
export class TechnologyModule {}
