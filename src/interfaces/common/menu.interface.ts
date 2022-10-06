export interface Menu {
  _id?: string;
  date?: string;
  type?: string;
  items?: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  lastUpdatedBy: {
    _id: string;
    name: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
