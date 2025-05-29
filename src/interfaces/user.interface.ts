export interface User {
  id: string;
  email: string;
  password: string;
  isDefault: boolean;
  role: 'customer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
