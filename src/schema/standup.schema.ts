import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const StandupSchema = new mongoose.Schema(
  {
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
    dateNum: {
      type: Number,
      required: false,
    },
    isJoined: {
      type: Boolean,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
