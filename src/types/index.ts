export type UserRole = 'OWNER' | 'HERDSMAN';

export interface User {
  id: string;
  farmId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  phone?: string;
  description?: string;
  status: string;
  createdAt: string;
  createdBy: string;
}

export interface MilkRecord {
  id: string;
  farmId: string;
  recordedBy: string;
  date: string;
  morningLitres: number;
  eveningLitres: number;
  totalLitres: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  farmId: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Buyer {
  id: string;
  farmId: string;
  name: string;
  phone?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  farmId: string;
  buyerId?: string;
  buyerName: string;
  date: string;
  quantityLitres: number;
  pricePerLitre: number;
  totalAmount: number;
  recordedBy: string;
  createdAt: string;
}

export interface DashboardSummary {
  todayMilk: number;
  totalMilk: number;
  milkSold: number;
  salesTotal: number;
  expensesTotal: number;
  recentMilkRecords: MilkRecord[];
  recentSales?: Sale[];
  recentExpenses?: Expense[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}
