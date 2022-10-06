import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const PaymentSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    user: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
    createdBy: {
      _id: {
        type: String,
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
    lastUpdatedBy: {
      _id: {
        type: String,
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
