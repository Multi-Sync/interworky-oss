'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ErrorTrendsChart({ data, isLoading }) {
  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700/30 rounded"></div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600 dark:text-gray-400">
        <p>No error trend data available</p>
      </div>
    );
  }

  // Format data for chart (using UTC to match error list dates)
  const chartData = data.map(item => {
    const date = new Date(item.date);
    // Format using UTC to avoid timezone confusion
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return {
      date: formattedDate,
      Critical: item.critical || 0,
      High: item.high || 0,
      Medium: item.medium || 0,
      Low: item.low || 0,
      Total: item.total || 0,
    };
  });

  // Detect theme for dynamic styling
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#d1d5db'} />
        <XAxis dataKey="date" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} style={{ fontSize: '12px' }} />
        <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            border: isDarkMode ? '1px solid #374151' : '1px solid #d1d5db',
            borderRadius: '8px',
            color: isDarkMode ? '#fff' : '#111827',
          }}
          labelStyle={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }} />
        <Line
          type="monotone"
          dataKey="Critical"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444', r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line type="monotone" dataKey="High" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
        <Line type="monotone" dataKey="Medium" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308', r: 3 }} />
        <Line type="monotone" dataKey="Low" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
        <Line type="monotone" dataKey="Total" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
