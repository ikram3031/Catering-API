import { Module } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { DesignationController } from './designation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DesignationSchema } from '../../schema/designation.schema';
import { UserSchema } from '../../schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Designation', schema: DesignationSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  providers: [DesignationService],
  controllers: [DesignationController],
})
export class DesignationModule {}
