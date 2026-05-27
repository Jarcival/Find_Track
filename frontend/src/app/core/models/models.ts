export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export interface TransactionsResponse {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  transactions: Transaction[];
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}

export interface Savings {
  id: number;
  user_id: number;
  balance: number;
  target_amount: number | null;
  target_date: string | null;
  active: boolean;
  created_at: string;
}

export const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'Salario', label: 'Salario', icon: '💼' },
  { value: 'Freelance', label: 'Freelance', icon: '💻' },
  { value: 'Inversiones', label: 'Inversiones', icon: '📈' },
  { value: 'Comida', label: 'Comida', icon: '🍔' },
  { value: 'Transporte', label: 'Transporte', icon: '🚗' },
  { value: 'Entretenimiento', label: 'Entretenimiento', icon: '🎬' },
  { value: 'Salud', label: 'Salud', icon: '🏥' },
  { value: 'Educación', label: 'Educación', icon: '📚' },
  { value: 'Ropa', label: 'Ropa', icon: '👕' },
  { value: 'Hogar', label: 'Hogar', icon: '🏠' },
  { value: 'Servicios', label: 'Servicios', icon: '💡' },
  { value: 'Ahorro', label: 'Ahorro (Cajita)', icon: '🎯' },
  { value: 'Otro', label: 'Otro', icon: '📦' },
];