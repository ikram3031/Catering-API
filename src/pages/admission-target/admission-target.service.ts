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
import { Admin } from '../../interfaces/admin.interface';
import {
  AddAdmissionTargetDto,
  FilterAndPaginationAdmissionTargetDto,
  OptionAdmissionTargetDto,
  UpdateAdmissionTargetDto,
} from '../../dto/admission-target.dto';
import {
  Admission,
  AdmissionTarget,
} from '../../interfaces/admission.interface';
import { FilterAndPaginationAdmissionDto } from '../../dto/admission.dto';

const ObjectId = Types.ObjectId;

@Injectable()
export class AdmissionTargetService {
  private logger = new Logger(AdmissionTargetService.name);

  constructor(
    @InjectModel('AdmissionTarget')
    private readonly admissionTargetModel: Model<AdmissionTarget>,
    @InjectModel('Admission')
    private readonly admissionModel: Model<Admission>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * addAdmissionTarget
   * insertManyAdmissionTarget
   */
  async addAdmissionTarget(
    admin: Admin,
    addAdmissionTargetDto: AddAdmissionTargetDto,
  ): Promise<ResponsePayload> {
    const adminData = await this.adminModel.findById(admin._id).select('name');
    const newData = new this.admissionTargetModel({
      ...addAdmissionTargetDto,
      ...{ admin: { _id: adminData._id, name: adminData.name } },
    });
    try {
      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Data Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyAdmissionTarget(
    addAdmissionTargetsDto: AddAdmissionTargetDto[],
    optionAdmissionTargetDto: OptionAdmissionTargetDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionAdmissionTargetDto;
    if (deleteMany) {
      await this.admissionTargetModel.deleteMany({});
    }
    try {
      const saveData = await this.admissionTargetModel.insertMany(
        addAdmissionTargetsDto,
      );
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
   * getAllAdmissionTargets
   * getAdmissionTargetById
   */

  async getAllAdmissionTargets(
    filterAdmissionTargetDto: FilterAndPaginationAdmissionTargetDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterAdmissionTargetDto;
    const { select } = filterAdmissionTargetDto;
    try {
      const dataTarget = await this.admissionTargetModel
        .find(filter, select)
        .populate({
          path: 'admissions',
          model: 'Admission',
          select: 'amount',
        });

      const data = JSON.parse(JSON.stringify(dataTarget)) as AdmissionTarget[];
      const mData: AdmissionTarget[] = data.map((m) => {
        return {
          ...m,
          ...{
            paid: m.admissions
              .map((t) => {
                return t.amount;
              })
              .reduce((acc, value) => acc + value, 0),
            admissions: [],
          },
        } as AdmissionTarget;
      });

      return {
        data: mData,
        success: true,
        message: 'Success',
        count: mData.length,
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! AdmissionTargetion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getAdmissionTargetById(
    id: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.admissionTargetModel.findById(id).select(select);
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
   * updateAdmissionTargetById
   * updateMultipleAdmissionTargetById
   */
  async updateAdmissionTargetById(
    id: string,
    updateAdmissionTargetDto: UpdateAdmissionTargetDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.admissionTargetModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.admissionTargetModel.findByIdAndUpdate(id, {
        $set: updateAdmissionTargetDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleAdmissionTargetById(
    ids: string[],
    updateAdmissionTargetDto: UpdateAdmissionTargetDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.admissionTargetModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateAdmissionTargetDto },
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
   * deleteAdmissionTargetById
   * deleteMultipleAdmissionTargetById
   */
  async deleteAdmissionTargetById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.admissionTargetModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.admissionTargetModel.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleAdmissionTargetById(
    ids: string[],
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.admissionTargetModel.deleteMany({ _id: mIds });
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
   * getAllAdmissionsByUser()
   */
  async getAllAdmissionTargetsByUser(
    user: User,
    filterAdmissionTargetDto: FilterAndPaginationAdmissionTargetDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      let { filter } = filterAdmissionTargetDto;
      if (filter) {
        filter = { ...filter, ...{ 'user._id': new ObjectId(user._id) } };
      }
      filterAdmissionTargetDto.filter = filter;
      return this.getAllAdmissionTargets(filterAdmissionTargetDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async checkAdmissionTargetsByUser(
    user: User,
    filterAdmissionTargetDto: FilterAndPaginationAdmissionTargetDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      let { filter } = filterAdmissionTargetDto;
      if (filter) {
        filter = { ...filter, ...{ 'user._id': new ObjectId(user._id) } };
      }
      filterAdmissionTargetDto.filter = filter;
      const dataTarget = await this.admissionTargetModel.findOne(
        filterAdmissionTargetDto.filter,
      );

      return {
        data: dataTarget,
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
