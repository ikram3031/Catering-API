import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const AdmissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNo: {
      type: String,
      required: true,
    },
    project: {
      type: String,
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
    note: {
      type: String,
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    dateString: {
      type: String,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: false,
    },
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
