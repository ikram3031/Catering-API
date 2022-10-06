import { Module } from '@nestjs/common';
import { BazaarService } from './bazaar.service';
import { BazaarController } from './bazaar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BazaarSchema } from '../../schema/bazaar.schema';
import { UserSchema } from '../../schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Bazaar', schema: BazaarSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  providers: [BazaarService],
  controllers: [BazaarController],
})
export class BazaarModule {}
