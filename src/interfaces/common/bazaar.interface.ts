export interface Bazaar {
  _id?: string;
  date?: string;
  items?: BazarItem[];
  totalAmount?: number;
  month?: number;
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

export interface BazarItem {
  name?: string;
  amount?: number;
}
