import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const GallerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    folder: {
      type: Schema.Types.ObjectId,
      ref: 'FileFolder',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
