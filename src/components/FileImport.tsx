import React, { useState, useCallback } from 'react';
import { Upload, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { parseTransactionFile } from '../utils/importParser';
import type { Transaction } from '../types';

interface FileImportProps {
  onImport: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export function FileImport({ onImport }: FileImportProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);

    try {
      const transactions = await parseTransactionFile(file);
      if (transactions.length > 0) {
        onImport(transactions);
      } else {
        setError('有効な取引データが見つかりませんでした。ファイルの形式を確認してください。');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  }, [onImport]);

  return (
    <div className="relative">
      <label className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'
      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {isLoading ? '処理中...' : 'インポート'}
        <input
          type="file"
          accept=".txt,.csv"
          onChange={handleImport}
          className="hidden"
          disabled={isLoading}
        />
      </label>

      {error && (
        <div className="absolute top-full mt-2 w-96 bg-red-50 border border-red-200 rounded-md p-4 z-50">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 ml-2"
              type="button"
            >
              <XCircle className="h-5 w-5 text-red-400 hover:text-red-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}