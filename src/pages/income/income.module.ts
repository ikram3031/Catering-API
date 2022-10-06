import { Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeController } from './income.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../schema/user.schema';
import { IncomeSchema } from '../../schema/income.schema';
import { AdminSchema } from '../../schema/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Income', schema: IncomeSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Admin', schema: AdminSchema },
    ]),
  ],
  providers: [IncomeService],
  controllers: [IncomeController],
})
export class IncomeModule {}
