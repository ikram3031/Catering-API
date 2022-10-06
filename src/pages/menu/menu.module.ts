import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuSchema } from '../../schema/menu.schema';
import { UserSchema } from '../../schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Menu', schema: MenuSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  providers: [MenuService],
  controllers: [MenuController],
})
export class MenuModule {}
