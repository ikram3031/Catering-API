import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const TASK_LIST_SCHEMA = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    checked: {
      type: Boolean,
      required: true,
    },
    expectedTimeInMinute: {
      type: Number,
      required: false,
    },
    actualTimeInMinute: {
      type: Number,
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endDate: {
      type: String,
      required: false,
    },
    startDate: {
      type: String,
      required: false,
    },
    note: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export const INVOICE_ITEM_SCHEMA = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: false,
    },
    discountType: {
      type: Number,
      required: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);
