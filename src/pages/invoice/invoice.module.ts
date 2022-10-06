import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSchema } from '../../schema/admin.schema';
import { InvoiceSchema } from '../../schema/invoice.schema';
import { UniqueIdSchema } from '../../schema/unique-id.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'Admin', schema: AdminSchema },
      { name: 'UniqueId', schema: UniqueIdSchema },
    ]),
  ],
  providers: [InvoiceService],
  controllers: [InvoiceController],
})
export class InvoiceModule {
}
