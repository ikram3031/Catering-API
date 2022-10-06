import { Module } from '@nestjs/common';
import { StandupService } from './standup.service';
import { StandupController } from './standup.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../schema/user.schema';
import { AdminSchema } from '../../schema/admin.schema';
import { StandupSchema } from '../../schema/standup.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Standup', schema: StandupSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Admin', schema: AdminSchema },
    ]),
  ],
  providers: [StandupService],
  controllers: [StandupController],
})
export class StandupModule {}
