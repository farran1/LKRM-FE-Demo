'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SeriesPoint {
  x: number;
  y: number;
}

interface Expense {
  id: number;
  date: string;
  amount: number;
}

interface ExpensesChartProps {
  budgetId: number;
}

export default function ExpensesChart({ budgetId }: ExpensesChartProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, [budgetId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expenses?budgetId=${budgetId}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.data || []);
      } else {
        console.error('Failed to fetch expenses:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from real expenses
  const chartData = useMemo(() => {
    if (!expenses.length) return [];

    // Group expenses by day
    const expensesByDay = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const day = date.getDate();
      if (!acc[day]) acc[day] = 0;
      acc[day] += expense.amount;
      return acc;
    }, {} as Record<number, number>);

    // Create data points for each day of the month
    const days = 31;
    const data = [];
    let cumulativeExpenses = 0;

    for (let day = 1; day <= days; day++) {
      const dayExpenses = expensesByDay[day] || 0;
      cumulativeExpenses += dayExpenses;
      
      data.push({
        day,
        expenses: cumulativeExpenses,
        remaining: Math.max(0, 10000 - cumulativeExpenses), // TODO: Get actual budget amount
      });
    }

    return data;
  }, [expenses]);

  if (loading) {
    return <div>Loading chart data...</div>;
  }

  if (!expenses.length) {
    return <div>No expense data available for this budget.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="day" 
          label={{ value: 'Day of Month', position: 'insideBottom', offset: -10 }}
        />
        <YAxis 
          label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          labelFormatter={(label) => `Day ${label}`}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          stroke="#fa8c16" 
          strokeWidth={2}
          name="Cumulative Expenses"
        />
        <Line 
          type="monotone" 
          dataKey="remaining" 
          stroke="#52c41a" 
          strokeWidth={2}
          name="Budget Remaining"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}




