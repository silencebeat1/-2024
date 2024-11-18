import React, { useState } from 'react';
import type { Transaction } from '../types';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [date, setDate] = useState('');
  const [store, setStore] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !amount) return;

    // 店舗名が空の場合は「未指定」を設定
    const storeName = store.trim() || '未指定';

    onSubmit({
      date,
      store: storeName,
      amount: Number(amount) * (type === 'expense' ? -1 : 1),
      type,
    });

    setDate('');
    setStore('');
    setAmount('');
    setType('expense');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:flex md:space-x-4 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">店舗</label>
        <input
          type="text"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          placeholder="未指定"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">金額</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          min="0"
          step="100"
          required
        />
      </div>
      <div className="flex-1">
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="income"
              checked={type === 'income'}
              onChange={(e) => setType(e.target.value as 'income')}
              className="form-radio text-blue-600"
            />
            <span className="ml-2">収入</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="expense"
              checked={type === 'expense'}
              onChange={(e) => setType(e.target.value as 'expense')}
              className="form-radio text-red-600"
            />
            <span className="ml-2">支出</span>
          </label>
        </div>
      </div>
      <button
        type="submit"
        className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        追加
      </button>
    </form>
  );
}