import React, { useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { MonthSelector } from './components/MonthSelector';
import { TransactionForm } from './components/TransactionForm';
import { Summary } from './components/Summary';
import { TransactionChart } from './components/TransactionChart';
import { TransactionList } from './components/TransactionList';
import { OCRImport } from './components/OCRImport';
import { FileImport } from './components/FileImport';
import type { Transaction } from './types';

function App() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Filter transactions for selected month
  const monthlyTransactions = transactions.filter(t => 
    t.date.startsWith(format(selectedMonth, 'yyyy-MM'))
  );

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    // Round amount to nearest hundred when adding
    const roundedAmount = Math.floor(newTransaction.amount / 100) * 100;
    setTransactions(prev => [...prev, {
      ...newTransaction,
      amount: roundedAmount,
      id: crypto.randomUUID()
    }]);
  };

  const handleAddTransactions = (newTransactions: Omit<Transaction, 'id'>[]) => {
    // Round amounts to nearest hundred when importing
    const roundedTransactions = newTransactions.map(t => ({
      ...t,
      amount: Math.floor(t.amount / 100) * 100
    }));
    
    setTransactions(prev => [
      ...prev,
      ...roundedTransactions.map(t => ({ ...t, id: crypto.randomUUID() }))
    ]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTransaction = (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { 
        ...t, 
        ...updates,
        // Round amount to nearest hundred when editing
        amount: updates.amount ? Math.floor(updates.amount / 100) * 100 : t.amount
      } : t
    ));
  };

  const roundToHundred = (amount: number) => {
    return Math.floor(Math.abs(amount) / 100) * 100;
  };

  const formatAmount = (amount: number) => {
    const roundedAmount = roundToHundred(amount);
    return `${amount >= 0 ? '+' : '-'}¥${roundedAmount.toLocaleString()}`;
  };

  const handleMonthlyExport = () => {
    const monthStr = format(selectedMonth, 'yyyy-MM');
    
    // Calculate totals
    const incomeTransactions = monthlyTransactions.filter(t => t.amount > 0);
    const expenseTransactions = monthlyTransactions.filter(t => t.amount < 0);
    
    const totalIncome = roundToHundred(
      incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    );
    const totalExpense = roundToHundred(
      expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    );
    const balance = totalIncome - totalExpense;

    const content = [
      `=== ${monthStr} 収支レポート ===`,
      `総収入: +¥${totalIncome.toLocaleString()}`,
      `総支出: -¥${totalExpense.toLocaleString()}`,
      `残高: ${balance >= 0 ? '+' : '-'}¥${Math.abs(balance).toLocaleString()}`,
      '\n=== 取引詳細 ===',
      ...monthlyTransactions
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(t => {
          const roundedAmount = roundToHundred(t.amount);
          return `${t.date}\t${t.amount >= 0 ? '+' : '-'}¥${roundedAmount.toLocaleString()}\t${t.store}`;
        })
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${monthStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleYearlyExport = () => {
    const year = format(selectedMonth, 'yyyy');
    const yearlyTransactions = transactions.filter(t => 
      t.date.startsWith(year)
    );

    // 月ごとに取引を分類
    const monthlyData = new Map<string, Transaction[]>();
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      monthlyData.set(monthStr, yearlyTransactions.filter(t => 
        t.date.startsWith(monthStr)
      ));
    }

    const content = [`=== ${year}年 年間収支レポート ===\n`];

    let yearlyIncome = 0;
    let yearlyExpense = 0;

    // 月ごとの集計
    monthlyData.forEach((transactions, monthStr) => {
      if (transactions.length === 0) return;

      const incomeTransactions = transactions.filter(t => t.amount > 0);
      const expenseTransactions = transactions.filter(t => t.amount < 0);
      
      const monthlyIncome = roundToHundred(
        incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
      );
      const monthlyExpense = roundToHundred(
        expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      );
      const monthlyBalance = monthlyIncome - monthlyExpense;

      yearlyIncome += monthlyIncome;
      yearlyExpense += monthlyExpense;

      content.push(`=== ${monthStr} ===`);
      content.push(`総収入: +¥${monthlyIncome.toLocaleString()}`);
      content.push(`総支出: -¥${monthlyExpense.toLocaleString()}`);
      content.push(`残高: ${monthlyBalance >= 0 ? '+' : '-'}¥${Math.abs(monthlyBalance).toLocaleString()}\n`);
      content.push('取引詳細:');
      
      transactions
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach(t => {
          const roundedAmount = roundToHundred(t.amount);
          content.push(`${t.date}\t${t.amount >= 0 ? '+' : '-'}¥${roundedAmount.toLocaleString()}\t${t.store}`);
        });
      
      content.push(''); // 空行を追加
    });

    // 年間集計を追加
    const yearlyBalance = yearlyIncome - yearlyExpense;
    content.unshift(''); // 年間集計の前に空行を追加
    content.unshift(`年間残高: ${yearlyBalance >= 0 ? '+' : '-'}¥${Math.abs(yearlyBalance).toLocaleString()}`);
    content.unshift(`年間総支出: -¥${yearlyExpense.toLocaleString()}`);
    content.unshift(`年間総収入: +¥${yearlyIncome.toLocaleString()}`);

    const blob = new Blob([content.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yearly-finance-report-${year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">月間収支レポート</h1>
        
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
          <div className="flex gap-2">
            <button
              onClick={handleMonthlyExport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              月間エクスポート
            </button>
            <button
              onClick={handleYearlyExport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FileDown className="h-4 w-4 mr-2" />
              年間エクスポート
            </button>
            <FileImport onImport={handleAddTransactions} />
            <OCRImport onImport={handleAddTransaction} />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <TransactionForm onSubmit={handleAddTransaction} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">概要</h2>
          <Summary transactions={transactions} selectedMonth={selectedMonth} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">収支グラフ</h2>
          <TransactionChart transactions={monthlyTransactions} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">取引詳細</h2>
          <TransactionList
            transactions={monthlyTransactions}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
          />
        </div>
      </div>
    </div>
  );
}

export default App;