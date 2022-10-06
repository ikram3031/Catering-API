import * as mongoose from 'mongoose';

export const BazaarSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    items: {
      type: [Object],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
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
