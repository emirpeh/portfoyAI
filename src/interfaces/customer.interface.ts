export interface Customer {
  id: number;
  userId: string;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
