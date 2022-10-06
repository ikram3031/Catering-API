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
import {
  AddStandupDto,
  FilterAndPaginationStandupDto,
  OptionStandupDto,
  UpdateStandupDto,
} from '../../dto/standup.dto';
import { Admin } from '../../interfaces/admin.interface';
import { Standup } from '../../interfaces/standup.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class StandupService {
  private logger = new Logger(StandupService.name);

  constructor(
    @InjectModel('Standup')
    private readonly standupModel: Model<Standup>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * addStandup
   * insertManyStandup
   */
  async addStandup(addStandupDto: AddStandupDto): Promise<ResponsePayload> {
    const { user } = addStandupDto;

    try {
      if (!user.name) {
        const { name } = await this.userModel.findById(user._id).select('name');
        user.name = name;
      }
      const checkData = await this.standupModel.findOne({
        dateString: addStandupDto.dateString,
        'user._id': new ObjectId(user._id),
      });

      if (checkData) {
        return {
          success: false,
          message: 'This date data already added',
          data: null,
        } as ResponsePayload;
      } else {
        const newData = new this.standupModel({
          ...addStandupDto,
        });
        const saveData = await newData.save();
        const data = {
          _id: saveData._id,
        };
        // await this.standupTargetModel.updateOne(
        //   { 'user._id': user._id, project: project, month: month },
        //   { $push: { standups: saveData._id } },
        // );
        return {
          success: true,
          message: 'Data Added Success',
          data,
        } as ResponsePayload;
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyStandup(
    addStandupsDto: AddStandupDto[],
    optionStandupDto: OptionStandupDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionStandupDto;
    if (deleteMany) {
      await this.standupModel.deleteMany({});
    }
    try {
      const saveData = await this.standupModel.insertMany(addStandupsDto);
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
   * getAllStandups
   * getStandupById
   */

  async getAllStandups(
    filterStandupDto: FilterAndPaginationStandupDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterStandupDto;
    const { pagination } = filterStandupDto;
    const { sort } = filterStandupDto;
    const { select } = filterStandupDto;

    // Modify Id as Object ID
    if (filter && filter['user._id']) {
      filter['user._id'] = new ObjectId(filter['user._id']);
    }

    if (filter && filter['admin._id']) {
      filter['admin._id'] = new ObjectId(filter['admin._id']);
    }

    // Essential Variables
    const aggregateSstandupes = [];
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
      aggregateSstandupes.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSstandupes.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSstandupes.push({ $project: mSelect });
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

      aggregateSstandupes.push(mPagination);

      aggregateSstandupes.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.standupModel.aggregate(
        aggregateSstandupes,
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
        throw new BadRequestException('Error! Standupion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getStandupById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.standupModel.findById(id).select(select);
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
   * updateStandupById
   * updateMultipleStandupById
   */
  async updateStandupById(
    id: string,
    updateStandupDto: UpdateStandupDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.standupModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.standupModel.findByIdAndUpdate(id, {
        $set: updateStandupDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleStandupById(
    ids: string[],
    updateStandupDto: UpdateStandupDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.standupModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateStandupDto },
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
   * deleteStandupById
   * deleteMultipleStandupById
   */
  async deleteStandupById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.standupModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.standupModel.findByIdAndDelete(id);

      // await this.standupTargetModel.updateMany(
      //   {},
      //   {
      //     $pull: { standups: new ObjectId(id) },
      //   },
      // );

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleStandupById(
    ids: string[],
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.standupModel.deleteMany({ _id: mIds });

      // await this.standupTargetModel.updateMany(
      //   {},
      //   { $pull: { standups: { $in: mIds } } },
      // );

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
   * addStandupByUser()
   * getAllStandupsByUser()
   */
  async addStandupByUser(
    user: User,
    addStandupDto: AddStandupDto,
  ): Promise<ResponsePayload> {
    try {
      addStandupDto.user = await this.userModel
        .findById(user._id)
        .select('name');
      return this.addStandup(addStandupDto);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllStandupsByUser(
    user: User,
    filterStandupDto: FilterAndPaginationStandupDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    try {
      let { filter } = filterStandupDto;
      if (filter || searchQuery) {
        filter = { ...filter, ...{ 'user._id': new ObjectId(user._id) } };
      }
      filterStandupDto.filter = filter;

      return this.getAllStandups(filterStandupDto, searchQuery);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
