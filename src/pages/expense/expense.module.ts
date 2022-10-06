import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../schema/user.schema';
import { ExpenseSchema } from '../../schema/expense.schema';
import { AdminSchema } from '../../schema/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Expense', schema: ExpenseSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Admin', schema: AdminSchema },
    ]),
  ],
  providers: [ExpenseService],
  controllers: [ExpenseController],
})
export class ExpenseModule {}
