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
import { Invoice } from '../../interfaces/invoice.interface';
import {
  AddInvoiceDto,
  FilterAndPaginationInvoiceDto,
  OptionInvoiceDto,
  UpdateInvoiceDto,
} from '../../dto/invoice.dto';
import { Admin } from '../../interfaces/admin.interface';
import { UniqueId } from '../../interfaces/unique-id.interface';

const ObjectId = Types.ObjectId;

@Injectable()
export class InvoiceService {
  private logger = new Logger(InvoiceService.name);

  constructor(
    @InjectModel('Invoice')
    private readonly invoiceModel: Model<Invoice>,
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    @InjectModel('UniqueId') private readonly uniqueIdModel: Model<UniqueId>,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {
  }

  /**
   * addInvoice
   * insertManyInvoice
   */
  async addInvoice(
    admin: Admin,
    addInvoiceDto: AddInvoiceDto,
  ): Promise<ResponsePayload> {
    const adminData = await this.adminModel.findById(admin._id).select('name');

    // Increment Invoice Id Unique
    const uniqueData = await this.uniqueIdModel.findOneAndUpdate(
      {},
      { $inc: { invoiceId: 1 } },
      { new: true, upsert: true },
    );

    const invoiceIdUnique = this.utilsService.padLeadingZeros(
      uniqueData.invoiceId,
    );

    const dataExtra = {
      invoiceId: invoiceIdUnique,
      generatedBy: { _id: adminData._id, name: adminData.name },
    };
    const mData = { ...addInvoiceDto, ...dataExtra };
    const newData = new this.invoiceModel(mData);
    try {
      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
        invoiceId: saveData.invoiceId,
      };
      return {
        success: true,
        message: 'Invoice Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async insertManyInvoice(
    addInvoicesDto: AddInvoiceDto[],
    optionInvoiceDto: OptionInvoiceDto,
  ): Promise<ResponsePayload> {
    const { deleteMany } = optionInvoiceDto;
    if (deleteMany) {
      await this.invoiceModel.deleteMany({});
    }
    try {
      const saveData = await this.invoiceModel.insertMany(addInvoicesDto);
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
   * getAllInvoices
   * getInvoiceById
   */

  async getAllInvoices(
    filterInvoiceDto: FilterAndPaginationInvoiceDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterInvoiceDto;
    const { pagination } = filterInvoiceDto;
    const { sort } = filterInvoiceDto;
    const { select } = filterInvoiceDto;

    // Modify Id as Object ID
    if (filter && filter['project._id']) {
      filter['project._id'] = new ObjectId(filter['project._id']);
    }

    if (filter && filter['admin._id']) {
      filter['admin._id'] = new ObjectId(filter['admin._id']);
    }

    // Essential Variables
    const aggregateSinvoicees = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match
    if (filter) {
      mFilter = { ...mFilter, ...filter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ name: new RegExp(searchQuery, 'i') } };
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
      aggregateSinvoicees.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateSinvoicees.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateSinvoicees.push({ $project: mSelect });
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

      aggregateSinvoicees.push(mPagination);

      aggregateSinvoicees.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    try {
      const dataAggregates = await this.invoiceModel.aggregate(
        aggregateSinvoicees,
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
        throw new BadRequestException('Error! Invoiceion mismatch');
      } else {
        throw new InternalServerErrorException(err.message);
      }
    }
  }

  async getInvoiceById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.invoiceModel.findById(id).select(select);
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
   * updateInvoiceById
   * updateMultipleInvoiceById
   */
  async updateInvoiceById(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.invoiceModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.invoiceModel.findByIdAndUpdate(id, {
        $set: updateInvoiceDto,
      });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async updateMultipleInvoiceById(
    ids: string[],
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<ResponsePayload> {
    const mIds = ids.map((m) => new ObjectId(m));

    try {
      await this.invoiceModel.updateMany(
        { _id: { $in: mIds } },
        { $set: updateInvoiceDto },
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
   * deleteInvoiceById
   * deleteMultipleInvoiceById
   */
  async deleteInvoiceById(
    id: string,
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    let data;
    try {
      data = await this.invoiceModel.findById(id);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      await this.invoiceModel.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleInvoiceById(
    ids: string[],
    checkUsage?: boolean,
  ): Promise<ResponsePayload> {
    try {
      const mIds = ids.map((m) => new ObjectId(m));
      await this.invoiceModel.deleteMany({ _id: mIds });
      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
