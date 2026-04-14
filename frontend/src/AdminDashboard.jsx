import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Maharashtra', count: 43000 },
  { name: 'Uttar Pradesh', count: 97000 },
  { name: 'Madhya Pradesh', count: 54000 },
  { name: 'Rajasthan', count: 44000 },
  { name: 'Bihar', count: 39000 },
];

export default function AdminDashboard() {
  const handleExport = (type) => {
    // In a real app, you would pass the JWT token here
    window.open(`http://localhost:3000/v1/admin/export/${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard Analytics</h1>
        <div className="space-x-3">
          <button onClick={() => handleExport('csv')} className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Download CSV</button>
          <button onClick={() => handleExport('json')} className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Download JSON</button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Total Villages', 'Active Users', 'API Requests (Today)', 'Avg Response Time'].map((metric, i) => (
          <div key={i} className="bg-white p-4 rounded shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">{metric}</div>
            <div className="text-2xl font-bold text-gray-800">
              {i === 0 ? '600,000+' : i === 1 ? '142' : i === 2 ? '84,392' : '48ms'}
            </div>
            <div className="text-xs text-green-500 mt-2 font-medium">↑ +5.2%</div>
          </div>
        ))}
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Top States by Village Count</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-center h-96">
          <div className="text-gray-400">Other Charts (Line, Pie, Area) Stub</div>
        </div>
      </div>
    </div>
  );
}