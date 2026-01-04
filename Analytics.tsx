
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GeneratedContent } from '../types';

const data = [
  { name: 'Mon', views: 4000, revenue: 24 },
  { name: 'Tue', views: 3000, revenue: 18 },
  { name: 'Wed', views: 2000, revenue: 12 },
  { name: 'Thu', views: 2780, revenue: 15 },
  { name: 'Fri', views: 1890, revenue: 10 },
  { name: 'Sat', views: 2390, revenue: 14 },
  { name: 'Sun', views: 3490, revenue: 21 },
];

interface AnalyticsProps {
  videos: GeneratedContent[];
}

const Analytics: React.FC<AnalyticsProps> = ({ videos }) => {
  const totalViews = videos.reduce((acc, v) => acc + (v.analytics?.projectedViews || 0), 0);
  const totalRevenue = videos.reduce((acc, v) => acc + (v.analytics?.estimatedRevenue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
          <h4 className="text-slate-400 text-sm font-medium">Projected Reach</h4>
          <p className="text-3xl font-bold mt-2">{totalViews.toLocaleString()}</p>
          <p className="text-emerald-400 text-sm mt-1">↑ 12% from last batch</p>
        </div>
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
          <h4 className="text-slate-400 text-sm font-medium">Est. Ad Revenue</h4>
          <p className="text-3xl font-bold mt-2">${totalRevenue.toFixed(2)}</p>
          <p className="text-emerald-400 text-sm mt-1">↑ 8% engagement boost</p>
        </div>
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
          <h4 className="text-slate-400 text-sm font-medium">Active Channels</h4>
          <p className="text-3xl font-bold mt-2">3</p>
          <p className="text-slate-500 text-sm mt-1">TikTok, YT, FB</p>
        </div>
      </div>

      <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-6">Engagement Projection</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="views" stroke="#6366f1" fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
