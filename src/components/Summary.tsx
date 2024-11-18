import React, { useMemo } from 'react';
import { format } from 'date-fns';
import type { Transaction } from '../types';

interface SummaryProps {
  transactions: Transaction[];
  selectedMonth?: Date;
}

export function Summary({ transactions, selectedMonth = new Date() }: SummaryProps) {
  const { monthlyStats, yearlyStats } = useMemo(() => {
    const currentYear = format(new Date(), 'yyyy');
    const selectedMonthStr = format(selectedMonth, 'yyyy-MM');

    // 選択された月の取引
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonthStr));
    const monthlyIncome = monthlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = monthlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const monthlyBalance = monthlyIncome - monthlyExpense;

    // 年間の取引
    const yearlyTransactions = transactions.filter(t => t.date.startsWith(currentYear));
    const yearlyIncome = yearlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const yearlyExpense = yearlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const yearlyBalance = yearlyIncome - yearlyExpense;

    return {
      monthlyStats: { income: monthlyIncome, expense: monthlyExpense, balance: monthlyBalance },
      yearlyStats: { income: yearlyIncome, expense: yearlyExpense, balance: yearlyBalance }
    };
  }, [transactions, selectedMonth]);

  const SummaryBox = ({ title, income, expense, balance, variant }: {
    title: string;
    income: number;
    expense: number;
    balance: number;
    variant: 'yearly' | 'monthly';
  }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${variant === 'yearly' ? 'border-blue-100' : 'border-indigo-100'}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        <div className={`${variant === 'yearly' ? 'bg-blue-50' : 'bg-blue-100'} p-4 rounded-lg transition-all hover:shadow-md`}>
          <h4 className="text-sm font-medium text-blue-800">総収入</h4>
          <p className="text-2xl font-bold text-blue-600">¥{income.toLocaleString()}</p>
        </div>
        <div className={`${variant === 'yearly' ? 'bg-red-50' : 'bg-red-100'} p-4 rounded-lg transition-all hover:shadow-md`}>
          <h4 className="text-sm font-medium text-red-800">総支出</h4>
          <p className="text-2xl font-bold text-red-600">¥{expense.toLocaleString()}</p>
        </div>
        <div className={`${variant === 'yearly' ? 'bg-gray-50' : 'bg-gray-100'} p-4 rounded-lg transition-all hover:shadow-md`}>
          <h4 className="text-sm font-medium text-gray-800">残高</h4>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ¥{balance.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SummaryBox
        title={`年間概要 (${format(new Date(), 'yyyy')}年)`}
        income={yearlyStats.income}
        expense={yearlyStats.expense}
        balance={yearlyStats.balance}
        variant="yearly"
      />
      <SummaryBox
        title={`月間概要 (${format(selectedMonth, 'yyyy年MM月')})`}
        income={monthlyStats.income}
        expense={monthlyStats.expense}
        balance={monthlyStats.balance}
        variant="monthly"
      />
    </div>
  );
}