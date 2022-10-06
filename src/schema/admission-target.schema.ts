import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const AdmissionTargetSchema = new mongoose.Schema(
  {
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
    month: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    admissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Admission',
        required: false,
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
