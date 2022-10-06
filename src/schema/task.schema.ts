import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { TASK_LIST_SCHEMA } from './sub-schema.schema';

export const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    project: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    assignDate: {
      type: Date,
      required: false,
    },
    assignDateString: {
      type: String,
      required: false,
    },
    dueDate: {
      type: Date,
      required: false,
    },
    dueDateString: {
      type: String,
      required: false,
    },
    assignBy: {
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
    isDone: {
      type: Boolean,
      required: false,
    },
    assignTo: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],
    note: {
      type: String,
      required: false,
    },
    attachment: [Object],
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
      color: {
        type: String,
        required: true,
      },
    },
    list: [TASK_LIST_SCHEMA],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
