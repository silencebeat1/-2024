import React, { useState, useCallback, useMemo } from 'react';
import { ArrowUpDown, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
}

interface EditingTransaction {
  id: string;
  date: string;
  store: string;
  amount: number;
}

export function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  const [sortAsc, setSortAsc] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (dateA === dateB) {
        return a.amount - b.amount;
      }
      
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
  }, [transactions, sortAsc]);

  const handleEditStart = useCallback((transaction: Transaction) => {
    setEditingTransaction({
      id: transaction.id,
      date: transaction.date,
      store: transaction.store,
      amount: Math.abs(transaction.amount)
    });
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingTransaction(null);
  }, []);

  const handleEditSave = useCallback(() => {
    if (!editingTransaction) return;

    const transaction = transactions.find(t => t.id === editingTransaction.id);
    if (!transaction) return;

    const isExpense = transaction.amount < 0;
    // Round to nearest hundred when saving
    const roundedAmount = Math.floor(editingTransaction.amount / 100) * 100;
    const amount = roundedAmount * (isExpense ? -1 : 1);

    onEdit(editingTransaction.id, {
      date: editingTransaction.date,
      store: editingTransaction.store,
      amount
    });

    setEditingTransaction(null);
  }, [editingTransaction, transactions, onEdit]);

  // Function to round to nearest hundred (10の位を0に)
  const roundToHundred = useCallback((amount: number) => {
    return Math.floor(Math.abs(amount) / 100) * 100;
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                className="flex items-center space-x-1"
                onClick={() => setSortAsc(!sortAsc)}
              >
                <span>日付</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              店舗
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              金額
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedTransactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {editingTransaction?.id === transaction.id ? (
                  <input
                    type="date"
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({
                      ...editingTransaction,
                      date: e.target.value
                    })}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  transaction.date
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {editingTransaction?.id === transaction.id ? (
                  <input
                    type="text"
                    value={editingTransaction.store}
                    onChange={(e) => setEditingTransaction({
                      ...editingTransaction,
                      store: e.target.value
                    })}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  transaction.store
                )}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                transaction.amount >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {editingTransaction?.id === transaction.id ? (
                  <input
                    type="number"
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({
                      ...editingTransaction,
                      amount: Math.abs(parseFloat(e.target.value) || 0)
                    })}
                    className="border rounded px-2 py-1 w-32"
                    step="100"
                  />
                ) : (
                  <>
                    ¥{roundToHundred(transaction.amount).toLocaleString()}
                    {transaction.amount >= 0 ? ' (収入)' : ' (支出)'}
                  </>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  {editingTransaction?.id === transaction.id ? (
                    <>
                      <button
                        onClick={handleEditSave}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditStart(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}