import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../../shared/utils/utils.service';
import { ResponsePayload } from '../../interfaces/response-payload.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import { User } from '../../interfaces/user.interface';
import { Admission, AdmissionTarget, } from '../../interfaces/admission.interface';
import {
  AddAdmissionDto,
  FilterAndPaginationAdmissionDto,
  OptionAdmissionDto,
  UpdateAdmissionDto,
} from '../../dto/admission.dto';
import { Admin } from '../../interfaces/admin.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class AdmissionService {
  private logger = new Logger(AdmissionService.name);

  constructor(
    @InjectModel('Admission')
    private readonly admissionModel: Model<Admission>,
    @InjectModel('AdmissionTarget')
    private readonly admissionTargetModel: Model<AdmissionTarget>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * addAdmission
   * insertManyAdmission
   */
  async addAdmission(
    addAdmissionDto: AddAdmissionDto,
  ): Promise<ResponsePayload> {
    const { user } = addAdmissionDto;
    const { project } = addAdmissionDto;
    const { month } = addAdmissionDto;

    const newData = new this.admissionModel({
      ...addAdmissionDto,
    });
    try {
      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
      };
      await this.admissionTargetModel.updateOne(
        { 'user._id': user._id, project: project, month: month },
        { $push: { admissions: saveData._id } },
      );
      return {
        success: true,
        message: 'Data Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyAdmission(
    addAdmissionsDto: AddAdmissionDto[],
    optionAdmissionDto: OptionAdmissionDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionAdmissionDto;
    if (deleteMany) {
      await this.admissionModel.deleteMany({});
    }
    try {
      const saveData = await this.admissionModel.insertMany(addAdmissionsDto);
      return {
        success: true,
        message: `${
          saveData && saveData.length ? saveData.length : 0
        }  Data Added Success`,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * getAllAdmissions
   * getAdmissionById
   */

  async getAllAdmissions(
    filterAdmissionDto: FilterAndPaginationAdmissionDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterAdmissionDto;
    const { pagination } = filterAdmissionDto;
    const { sort } = filterAdmissionDto;
    const { select } = filterAdmissionDto;

    // Modify Id as Object ID
    if (filter && filter['user._id']) {
      filter['user._id'] = new ObjectId(filter['user._id']);
    }

    if (filter && filter['admin._id']) {
      filter['admin._id'] = new ObjectId(filter['admin._id']);
    }

    // Essential Variables
    const aggregateSadmissiones = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = {
        $and: [
          mFilter,
          {
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { phoneNo: { $regex: searchQuery, $options: 'i' } },
            ],
          },
        ],
      };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { createdAt: -1 };
    }

    // Select
    if (select) {
      mSelect = { ...select };
    } else {
      mSelect = { name: 1 };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateSadmissiones.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSadmissiones.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSadmissiones.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateSadmissiones.push(mPagination);

      aggregateSadmissiones.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.admissionModel.aggregate(
        aggregateSadmissiones,
      );
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Admissionion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAdmissionById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.admissionModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * updateAdmissionById
   * updateMultipleAdmissionById
   */
  async updateAdmissionById(
    id: string,
    updateAdmissionDto: UpdateAdmissionDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.admissionModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.admissionModel.findByIdAndUpdate(id, {
        $set: updateAdmissionDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleAdmissionById(
    ids: string[],
    updateAdmissionDto: UpdateAdmissionDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.admissionModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateAdmissionDto },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * deleteAdmissionById
   * deleteMultipleAdmissionById
   */
  async deleteAdmissionById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.admissionModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.admissionModel.findByIdAndDelete(id);

      await this.admissionTargetModel.updateMany(
        {},
        {
          $pull: { admissions: new ObjectId(id) },
        },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleAdmissionById(
    ids: string[],
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.admissionModel.deleteMany({ _id: mIds });

      await this.admissionTargetModel.updateMany(
        {},
        { $pull: { admissions: { $in: mIds } } },
      );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * USER ACCESS AREA
   * addAdmissionByUser()
   * getAllAdmissionsByUser()
   */
  async addAdmissionByUser(
    user: User,
    addAdmissionDto: AddAdmissionDto,
  ): Promise<ResponsePayload> {
    try {
      addAdmissionDto.user = await this.userModel.findById(user._id).select('name');
      return this.addAdmission(addAdmissionDto);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllAdmissionsByUser(
    user: User,
    filterAdmissionDto: FilterAndPaginationAdmissionDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      let { filter } = filterAdmissionDto;
      if (filter || searchQuery) {
        filter = { ...filter, ...{ 'user._id': new ObjectId(user._id) } };
      }
      filterAdmissionDto.filter = filter;

      return this.getAllAdmissions(filterAdmissionDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
