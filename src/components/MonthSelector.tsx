import React from 'react';
import { format } from 'date-fns';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMonthChange(new Date(e.target.value));
  };

  return (
    <input
      type="month"
      value={format(selectedMonth, 'yyyy-MM')}
      onChange={handleMonthChange}
      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}