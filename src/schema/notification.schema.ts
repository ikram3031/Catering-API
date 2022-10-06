import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    groupBy: {
      type: String,
      required: false,
    },
    seenUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
