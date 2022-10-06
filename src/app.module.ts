import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './pages/user/user.module';
import { AdminModule } from './pages/admin/admin.module';
import { UtilsModule } from './shared/utils/utils.module';
import { TagModule } from './pages/tag/tag.module';
import { UploadModule } from './pages/upload/upload.module';
import { FileFolderModule } from './pages/file-folder/file-folder.module';
import { GalleryModule } from './pages/gallery/gallery.module';
import { TechnologyModule } from './pages/technology/technology.module';
import { TaskModule } from './pages/task/task.module';
import { ProjectCategoryModule } from './pages/project-category/project-category.module';
import { ProjectModule } from './pages/project/project.module';
import { DesignationModule } from './pages/designation/designation.module';
import { UserTypeModule } from './pages/user-type/user-type.module';
import { DashboardModule } from './pages/dashboard/dashboard.module';
import { ExpenseModule } from './pages/expense/expense.module';
import { IncomeModule } from './pages/income/income.module';
import { InvoiceModule } from './pages/invoice/invoice.module';
import { AdmissionModule } from './pages/admission/admission.module';
import { AdmissionTargetModule } from './pages/admission-target/admission-target.module';
import { StandupModule } from './pages/standup/standup.module';
import { NotificationModule } from './pages/notification/notification.module';
import { MenuModule } from './pages/menu/menu.module';
import { BazaarModule } from './pages/bazaar/bazaar.module';
import { PaymentSchema } from './schema/payment.schema';
import { PaymentModule } from './pages/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRoot(configuration().mongoCluster),
    CacheModule.register({ ttl: 432000, max: 1000, isGlobal: true }),
    AdminModule,
    UserModule,
    UtilsModule,
    TagModule,
    UploadModule,
    FileFolderModule,
    GalleryModule,
    TechnologyModule,
    TaskModule,
    ProjectCategoryModule,
    ProjectModule,
    DesignationModule,
    UserTypeModule,
    DashboardModule,
    ExpenseModule,
    IncomeModule,
    InvoiceModule,
    AdmissionModule,
    AdmissionTargetModule,
    StandupModule,
    NotificationModule,
    //...
    MenuModule,
    BazaarModule,
    PaymentModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
