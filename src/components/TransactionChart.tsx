import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import type { Transaction } from '../types';

// 必要なChartJSコンポーネントのみを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface TransactionChartProps {
  transactions: Transaction[];
}

export function TransactionChart({ transactions }: TransactionChartProps) {
  // useMemoを使用してデータ計算を最適化
  const { dates, chartData, options } = useMemo(() => {
    // 日付ごとの集計を1回のループで行う
    const dailyTotals = new Map<string, { income: number; expense: number; balance: number }>();
    let runningBalance = 0;

    transactions.forEach(transaction => {
      const date = transaction.date;
      const current = dailyTotals.get(date) || { income: 0, expense: 0, balance: 0 };
      
      if (transaction.amount >= 0) {
        current.income += transaction.amount;
      } else {
        current.expense += Math.abs(transaction.amount);
      }
      
      runningBalance += transaction.amount;
      current.balance = runningBalance;
      
      dailyTotals.set(date, current);
    });

    const sortedDates = Array.from(dailyTotals.keys()).sort();
    const incomes = sortedDates.map(date => dailyTotals.get(date)!.income);
    const expenses = sortedDates.map(date => -dailyTotals.get(date)!.expense);
    const balances = sortedDates.map(date => dailyTotals.get(date)!.balance);

    const maxValue = Math.max(...balances, ...incomes);
    const minValue = Math.min(...balances, ...expenses);
    const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1;

    return {
      dates: sortedDates,
      chartData: {
        labels: sortedDates,
        datasets: [
          {
            type: 'bar' as const,
            label: '収入',
            data: incomes,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            stack: 'stack0',
          },
          {
            type: 'bar' as const,
            label: '支出',
            data: expenses,
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1,
            stack: 'stack0',
          },
          {
            type: 'line' as const,
            label: '累積残高',
            data: balances,
            borderColor: 'rgb(75, 85, 99)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            min: Math.floor(minValue - padding),
            max: Math.ceil(maxValue + padding),
            grid: {
              color: (context: any) => context.tick.value === 0 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              lineWidth: (context: any) => context.tick.value === 0 ? 2 : 1,
            },
          },
        },
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = Math.abs(context.raw);
                const sign = context.raw >= 0 ? '+' : '-';
                return `${context.dataset.label}: ${sign}¥${value.toLocaleString()}`;
              },
            },
          },
        },
      },
    };
  }, [transactions]);

  if (dates.length === 0) {
    return <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
      データがありません
    </div>;
  }

  return (
    <div className="w-full h-[400px]">
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
}