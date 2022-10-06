import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../schema/user.schema';
import { AdminSchema } from '../../schema/admin.schema';
import { AdmissionTargetSchema } from '../../schema/admission-target.schema';
import { AdmissionTargetService } from './admission-target.service';
import { AdmissionTargetController } from './admission-target.controller';
import { AdmissionSchema } from '../../schema/admission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AdmissionTarget', schema: AdmissionTargetSchema },
      { name: 'Admission', schema: AdmissionSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Admin', schema: AdminSchema },
    ]),
  ],
  providers: [AdmissionTargetService],
  controllers: [AdmissionTargetController],
})
export class AdmissionTargetModule {}
