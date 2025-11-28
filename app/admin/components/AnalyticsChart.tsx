'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsChartProps {
  data: { name: string; revenue: number }[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <div className="h-[300px] w-full rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <h3 className="mb-6 font-serif text-lg font-medium text-stone-900 dark:text-white">Weekly Revenue</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value} Lei`} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            cursor={{ fill: 'transparent' }}
          />
          <Bar dataKey="revenue" fill="#1c1917" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
