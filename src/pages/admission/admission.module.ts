import { Module } from '@nestjs/common';
import { AdmissionService } from './admission.service';
import { AdmissionController } from './admission.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../schema/user.schema';
import { AdmissionSchema } from '../../schema/admission.schema';
import { AdminSchema } from '../../schema/admin.schema';
import { AdmissionTargetSchema } from '../../schema/admission-target.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Admission', schema: AdmissionSchema },
      { name: 'AdmissionTarget', schema: AdmissionTargetSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Admin', schema: AdminSchema },
    ]),
  ],
  providers: [AdmissionService],
  controllers: [AdmissionController],
})
export class AdmissionModule {}
