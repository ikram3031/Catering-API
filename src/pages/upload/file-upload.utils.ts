import { extname } from 'path';
import * as fs from 'fs';

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const name = transformToSlug(file.originalname.split('.')[0]);
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const getUploadPath = (req, file, callback) => {
  // Destination Folder Dynamic..
  // const { folderPath } = req.body;
  // const dir = `./upload/images/${folderPath ? folderPath : 'others'}`;
  const dir = `./upload/images`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return callback(null, dir);
};

const transformToSlug = (value: string): string => {
  return value
    .trim()
    .replace(/[^A-Z0-9]+/gi, '-')
    .toLowerCase();
};

