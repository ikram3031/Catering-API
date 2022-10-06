import * as mongoose from 'mongoose';
import { INVOICE_ITEM_SCHEMA } from './sub-schema.schema';
import { Schema } from 'mongoose';

export const InvoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNo: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
    },
    paymentStatus: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    dateString: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    project: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
    generatedBy: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    items: [INVOICE_ITEM_SCHEMA],
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
