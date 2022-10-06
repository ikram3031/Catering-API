import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  editFileName,
  getUploadPath,
  imageFileFilter,
} from './file-upload.utils';
import { UploadService } from './upload.service';
import {
  ImageUploadResponse,
  ResponsePayload,
} from '../../interfaces/response-payload.interface';

@Controller('upload')
export class UploadController {
  private logger = new Logger(UploadController.name);

  constructor(
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {}

  /**
   * SINGLE IMAGE
   * MULTIPLE IMAGE
   * GET IMAGE
   * DELETE SINGLE IMAGE
   * DELETE MULTIPLE IMAGE
   */
  @Post('single-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: getUploadPath,
        filename: editFileName,
      }),
      limits: {
        fileSize: 5 * 1000 * 1000,
      },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadSingleImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const baseurl =
      req.protocol + `${isProduction ? 's' : ''}://` + req.get('host') + '/api';
    const path = file.path;
    const url = `${baseurl}/${path}`;
    return {
      originalname: file.originalname,
      filename: file.filename,
      url,
    };
  }

  @Post('multiple-image')
  @UseInterceptors(
    FilesInterceptor('imageMulti', 10, {
      storage: diskStorage({
        destination: getUploadPath,
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadMultipleImages(
    @UploadedFiles() files: any[],
    @Req() req,
  ): Promise<ImageUploadResponse[]> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const baseurl =
      req.protocol + `${isProduction ? 's' : ''}://` + req.get('host') + '/api';
    const response: ImageUploadResponse[] = [];
    files.forEach((file) => {
      const fileResponse = {
        size: this.uploadService.bytesToKb(file.size),
        name: file.filename.split('.')[0],
        url: `${baseurl}/${file.path}`,
      } as ImageUploadResponse;
      response.push(fileResponse);
    });
    return response;
  }

  @Get('images/:imageName')
  seeUploadedFile(@Param('imageName') image, @Res() res) {
    return res.sendFile(image, { root: './upload/images' });
  }

  @Post('delete-single-image')
  deleteSingleFile(
    @Body('url') url: string,
    @Req() req,
  ): Promise<ResponsePayload> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const baseurl =
      req.protocol + `${isProduction ? 's' : ''}://` + req.get('host') + '/api';
    const path = `.${url.replace(baseurl, '')}`;
    return this.uploadService.deleteSingleFile(path);
  }

  @Post('delete-multiple-image')
  deleteMultipleFile(
    @Body('url') url: string[],
    @Req() req,
  ): Promise<ResponsePayload> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const baseurl =
      req.protocol + `${isProduction ? 's' : ''}://` + req.get('host') + '/api';
    return this.uploadService.deleteMultipleFile(baseurl, url);
  }
}
