'use client';
import React from 'react';
// KRİTİK DÜZELTME: Recharts bileşenleri artık kendi alt yollarından import ediliyor.
import { AreaChart } from 'recharts/lib/chart/AreaChart';
import { Area } from 'recharts/lib/cartesian/Area';
import { XAxis } from 'recharts/lib/cartesian/XAxis';
import { YAxis } from 'recharts/lib/cartesian/YAxis';
import { CartesianGrid } from 'recharts/lib/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/lib/component/Tooltip';
import { ResponsiveContainer } from 'recharts/lib/component/ResponsiveContainer';


const PerformanceChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const formatXAxis = (tickItem) => {
        try {
            return new Date(tickItem).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
        } catch (e) {
            return tickItem;
        }
    };

    const formatYAxis = (tickItem) => `$${tickItem.toLocaleString()}`;

    // Özel Tooltip içeriği
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-900/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 text-xs">
                    <p className="font-bold text-white">{new Date(label).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-indigo-400">Bakiye: <span className="font-semibold">${payload[0].value.toFixed(2)}</span></p>
                    {data.pnl && (
                         <p className={data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            Günlük PnL: {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
                         </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                }}
            >
                <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tickFormatter={formatXAxis} minTickGap={30} />
                <YAxis stroke="#9CA3AF" tickFormatter={formatYAxis} domain={['dataMin - 100', 'dataMax + 100']} allowDataOverflow={true} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="balance" stroke="#818CF8" fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default PerformanceChart;
