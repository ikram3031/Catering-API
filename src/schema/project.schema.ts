import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectCategory',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    technologies: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'Technology',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],
    tag: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    source: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    startDate: {
      type: String,
      required: false,
    },
    deadline: {
      type: String,
      required: false,
    },
    totalValue: {
      type: Number,
      required: false,
    },
    monthlyValue: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
      trim: false,
    },
    phoneNo: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      trim: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
