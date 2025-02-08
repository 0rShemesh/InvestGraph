'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface FormData {
  ticker: string;
  monthlyInvestment: string;
  startDay: string;
  numMonths: string;
}

interface InvestmentResult {
  date: string;
  price: number;
  shares_bought: number;
  total_shares: number;
  total_invested: number;
  current_value: number;
  profit: number;
  profit_percentage: number;
}

const StockTracker = () => {
  const [formData, setFormData] = useState<FormData>({
    ticker: '',
    monthlyInvestment: '',
    startDay: '',
    numMonths: ''
  });
  const [results, setResults] = useState<InvestmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('http://localhost:5000/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: formData.ticker.toUpperCase(),
          monthlyInvestment: Number(formData.monthlyInvestment),
          startDay: Number(formData.startDay),
          numMonths: Number(formData.numMonths)
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      if (Array.isArray(data)) {
        setResults(data);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Stock Investment Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Ticker</label>
                  <input
                    type="text"
                    name="ticker"
                    value={formData.ticker}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Investment ($)</label>
                  <input
                    type="number"
                    name="monthlyInvestment"
                    value={formData.monthlyInvestment}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Day of Month</label>
                  <input
                    type="number"
                    name="startDay"
                    value={formData.startDay}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                    min="1"
                    max="31"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Number of Months</label>
                  <input
                    type="number"
                    name="numMonths"
                    value={formData.numMonths}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                    min="1"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'Calculating...' : 'Calculate'}
              </button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Investment Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <LineChart
                    width={800}
                    height={400}
                    data={results}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="current_value" stroke="#8884d8" name="Portfolio Value" />
                    <Line type="monotone" dataKey="total_invested" stroke="#82ca9d" name="Total Invested" />
                  </LineChart>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares Bought</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Shares</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Invested</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">{result.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${result.price.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{result.shares_bought.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{result.total_shares.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${result.total_invested.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${result.current_value.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={result.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${result.profit.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={result.profit_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {result.profit_percentage.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default StockTracker;