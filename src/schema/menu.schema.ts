import * as mongoose from 'mongoose';

export const MenuSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    items: {
      type: [String],
      required: true,
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
