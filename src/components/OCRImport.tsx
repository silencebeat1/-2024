import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, Loader2 } from 'lucide-react';
import type { Transaction } from '../types';

interface OCRImportProps {
  onImport: (transaction: Omit<Transaction, 'id'>) => void;
}

// 金額を10の位で丸める関数（10の位を0にする）
function roundToTens(amount: number): number {
  return Math.floor(amount / 100) * 100; // 100で割って小数点以下を切り捨て、100を掛けて戻す
}

export function OCRImport({ onImport }: OCRImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setPreview(URL.createObjectURL(file));

    try {
      const worker = await createWorker('jpn');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // 日付を検出 (YYYY/MM/DD, YYYY-MM-DD, MM/DD形式に対応)
      const dateMatch = text.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}/);
      let date = new Date().toISOString().split('T')[0]; // デフォルトは今日
      if (dateMatch) {
        const dateStr = dateMatch[0];
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 2) {
            const year = new Date().getFullYear();
            date = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          } else {
            date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        } else {
          date = dateStr;
        }
      }

      // 金額を検出 (¥マークの後ろの数字)
      const amountMatch = text.match(/[¥￥][\d,]+/);
      let amount = 0;
      if (amountMatch) {
        const rawAmount = parseInt(amountMatch[0].replace(/[¥￥,]/g, ''));
        amount = -roundToTens(rawAmount); // 10の位を0にする
      }

      // 店舗名を検出 (最初の行を店舗名として扱う)
      const store = text.split('\n')[0].trim();

      onImport({
        date,
        store,
        amount,
        type: 'expense'
      });

    } catch (error) {
      console.error('OCR処理エラー:', error);
      alert('画像の処理中にエラーが発生しました。別の画像を試してください。');
    } finally {
      setIsProcessing(false);
      setPreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <div className="relative">
      <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer">
        <Camera className="h-4 w-4 mr-2" />
        レシートをスキャン
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />
      </label>

      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="text-center">
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mx-auto mb-4 max-h-48 object-contain"
                />
              )}
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">レシートを読み取っています...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}