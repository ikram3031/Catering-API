export interface Notification {
  _id?: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  image?: string;
  groupBy?: string;
  seenUsers?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
