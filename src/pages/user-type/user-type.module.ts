import { Module } from '@nestjs/common';
import { UserTypeService } from './user-type.service';
import { UserTypeController } from './user-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTypeSchema } from '../../schema/user-type.schema';
import { UserSchema } from '../../schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'UserType', schema: UserTypeSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  providers: [UserTypeService],
  controllers: [UserTypeController],
})
export class UserTypeModule {}
