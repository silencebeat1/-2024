import type { Transaction } from '../types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  standardDate?: string;
}

function validateDate(dateStr: string, lineNumber: number, currentYear?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!dateStr.trim()) {
    errors.push(`行 ${lineNumber}: 日付が空です`);
    return { isValid: false, errors, warnings };
  }

  // 日付文字列のクリーニング（全角スペースと半角スペースを削除）
  const cleanDate = dateStr.trim().replace(/[\s\u3000]+/g, '');
  
  // MM/DD形式の場合は年を追加
  if (/^\d{1,2}\/\d{1,2}$/.test(cleanDate)) {
    const year = currentYear || new Date().getFullYear().toString();
    const [month, day] = cleanDate.split('/').map(n => n.padStart(2, '0'));
    return {
      isValid: true,
      errors: [],
      warnings: [],
      standardDate: `${year}-${month}-${day}`
    };
  }

  // YYYY-MM-DD形式に変換（全角数字にも対応）
  const dateMatch = cleanDate.match(/^(\d{4})?[-/]?(\d{1,2})[-/](\d{1,2})$/);
  if (!dateMatch) {
    errors.push(`行 ${lineNumber}: 日付の形式が正しくありません`);
    return { isValid: false, errors, warnings };
  }

  const [_, year = currentYear || new Date().getFullYear().toString(), month, day] = dateMatch;
  const standardDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  // 日付の妥当性チェック
  const dateObj = new Date(standardDate);
  if (isNaN(dateObj.getTime())) {
    errors.push(`行 ${lineNumber}: 無効な日付です`);
    return { isValid: false, errors, warnings };
  }

  return { 
    isValid: true, 
    errors, 
    warnings,
    standardDate 
  };
}

// 金額を100円単位に丸める関数（10の位を0にする）
function roundToHundred(amount: number): number {
  return Math.floor(Math.abs(amount) / 100) * 100;
}

interface ParsedAmount {
  amount: number;
  type: 'income' | 'expense';
}

function parseAmount(amountStr: string): ParsedAmount | null {
  // 符号と数値を分離
  const match = amountStr.match(/([+-])?[¥￥]?(\d+(?:,\d{3})*)/);
  if (!match) return null;

  const [_, sign, numStr] = match;
  const amount = parseFloat(numStr.replace(/,/g, ''));
  if (isNaN(amount)) return null;

  // 符号に基づいて金額とタイプを決定
  const isPositive = sign === '+';
  const roundedAmount = roundToHundred(amount);

  return {
    amount: isPositive ? roundedAmount : -roundedAmount,
    type: isPositive ? 'income' : 'expense'
  };
}

function extractStoreName(line: string, dateStr: string, amounts: string[]): string {
  // 日付と金額を除去して店舗名を抽出
  let storePart = line;
  
  // 日付を除去
  storePart = storePart.replace(dateStr, '').trim();
  
  // すべての金額を除去
  amounts.forEach(amount => {
    storePart = storePart.replace(amount, '');
  });
  
  // 残高部分を除去 (=以降)
  storePart = storePart.split('=')[0];
  
  // 特殊文字と余分なスペースを除去
  storePart = storePart
    .replace(/[=\t]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return storePart || '未指定';
}

function parseLine(line: string, currentYear?: string): Omit<Transaction, 'id'>[] {
  const transactions: Omit<Transaction, 'id'>[] = [];
  
  // 空行やヘッダー行をスキップ
  if (!line.trim() || line.includes('===')) {
    return transactions;
  }

  // 全角スペースを半角に変換し、複数の空白を単一の空白に
  const normalizedLine = line.trim()
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ');

  // =の前後で分割して残高部分を除去
  const [transactionPart] = normalizedLine.split('=');
  if (!transactionPart) return transactions;

  // 日付を抽出
  const dateMatch = transactionPart.match(/^(\d{1,2}\/\d{1,2}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
  if (!dateMatch) return transactions;

  const dateValidation = validateDate(dateMatch[1], 0, currentYear);
  if (!dateValidation.isValid || !dateValidation.standardDate) return transactions;

  // 日付以降の部分から金額を抽出
  const amountPart = transactionPart.slice(dateMatch[0].length);
  
  // 金額のパターンにマッチする部分をすべて抽出
  const amountMatches = Array.from(amountPart.matchAll(/[+-][¥￥]?\d+(?:,\d{3})*/g));
  if (amountMatches.length === 0) return transactions;

  // 店舗名を抽出
  const storeName = extractStoreName(
    transactionPart,
    dateMatch[0],
    amountMatches.map(m => m[0])
  );
  
  // 各金額をパースして取引を作成
  amountMatches.forEach(match => {
    const parsedAmount = parseAmount(match[0]);
    if (parsedAmount) {
      transactions.push({
        date: dateValidation.standardDate!,
        amount: parsedAmount.amount,
        store: storeName,
        type: parsedAmount.type
      });
    }
  });

  return transactions;
}

export async function parseTransactionFile(file: File): Promise<Omit<Transaction, 'id'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        const transactions: Omit<Transaction, 'id'>[] = [];
        const allErrors: string[] = [];
        const allWarnings: string[] = [];

        let currentYear: string | null = null;

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;

          // タイトル行から年を抽出
          const titleMatch = trimmedLine.match(/(\d{4})[年-](\d{1,2})月/);
          if (titleMatch) {
            const [_, year] = titleMatch;
            currentYear = year;
            return;
          }

          const lineTransactions = parseLine(trimmedLine, currentYear || undefined);
          transactions.push(...lineTransactions);
        });

        if (allErrors.length > 0) {
          console.warn('Import errors:', allErrors);
        }

        if (allWarnings.length > 0) {
          console.warn('Import warnings:', allWarnings);
        }

        resolve(transactions);

      } catch (error) {
        console.error('File parsing error:', error);
        reject(new Error('ファイルの解析中にエラーが発生しました'));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込み中にエラーが発生しました'));
    };

    reader.readAsText(file);
  });
}