export interface Payment {
  _id?: string;
  date?: string;
  amount?: number;
  month?: number;
  user: {
    _id: string;
    name: string;
  };
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
  select?: boolean;
}
