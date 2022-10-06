import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const ExpenseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    category: {
      type: String,
      required: true,
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
