export interface Transaction {
  id: string;
  date: string;
  store: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface DailyTotal {
  date: string;
  total: number;
  balance: number;
}