import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const IncomeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    admin: {
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
    image: {
      type: String,
      required: false,
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
