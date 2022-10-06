import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { cors: true });
  // Allow Cors
  // app.enableCors({
  //   // origin: '*',
  //   origin: ['http://localhost:4201'],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   allowedHeaders: [
  //     'Content-Type,Authorization',
  //     'Content-Type,administrator',
  //   ],
  // });
  // Version Control
  app.enableVersioning({
    type: VersioningType.URI,
  });
  // Global Prefix

  app.setGlobalPrefix('api');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

bootstrap();
