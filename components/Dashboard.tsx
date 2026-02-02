import React, { useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle, TrendingUp, Zap, Power, AlertOctagon } from 'lucide-react';
import { ShiftLog } from '../types';

interface DashboardProps {
  logs: ShiftLog[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string; color: string }> = ({ 
  title, value, icon, trend, color 
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
      {trend && <p className="text-xs text-slate-400 mt-2 font-medium">{trend}</p>}
    </div>
    <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: `w-8 h-8 ${color.replace('bg-', 'text-')}` }) : icon}
    </div>
  </div>
);

const UnitStatusCard: React.FC<{ unitName: string; isOnline: boolean; currentLoad: number }> = ({ unitName, isOnline, currentLoad }) => {
  const statusBg = isOnline ? 'bg-emerald-50' : 'bg-slate-50';
  const statusText = isOnline ? 'text-emerald-700' : 'text-slate-500';
  const statusColor = isOnline ? 'bg-emerald-500' : 'bg-slate-400';
  const Icon = isOnline ? Zap : Power;

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col justify-between h-full hover:border-slate-300 transition-colors ${isOnline ? 'border-slate-100' : 'border-slate-100 opacity-90'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-slate-800">{unitName}</h4>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${statusBg} ${statusText}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <div className={`p-2 rounded-lg ${statusBg}`}>
          <Icon className={`w-5 h-5 ${statusText}`} />
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Beban Saat Ini</p>
        <div className="flex flex-col mt-1">
          {isOnline ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-800 font-mono">{currentLoad.toLocaleString('id-ID')}</span>
                <span className="text-sm text-slate-500 font-medium">MW</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Kapasitas: 2.5 MW</p>
            </>
          ) : (
            <span className="text-xl font-bold text-slate-300 font-mono">--</span>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ logs }) => {
  const units = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4'];

  // Helper to find latest status for a unit
  const getLatestUnitInfo = (unitId: string) => {
    // Sort logs by date descending
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const log of sortedLogs) {
      const entry = log.entries.find(e => e.unitId === unitId);
      if (entry) return entry;
    }
    // Default fallback
    return { isOnline: false, loadCurrent: 0, loadLowest: 0, loadHighest: 0 };
  };

  // Calculate Total Load from all units based on latest entries
  const totalLoad = units.reduce((sum, unitId) => {
    const info = getLatestUnitInfo(unitId);
    return sum + (info.isOnline ? (info.loadCurrent || 0) : 0);
  }, 0);

  // Generate Chart Data from Logs
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];

    // Find the latest date in logs to anchor the chart
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestDateStr = sortedLogs[0].date; // Use string directly to preserve YYYY-MM-DD aspect if possible, but safe to objectify
    const latestDate = new Date(latestDateStr);

    const daysIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dataPoints = [];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(latestDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = daysIndo[d.getDay()];

      // Aggregate all loads from all logs on this date
      const dailyTotal = logs
        .filter(log => log.date.startsWith(dateStr))
        .reduce((sumLog, log) => {
          const logLoad = log.entries.reduce((sumEntry, entry) => {
            return sumEntry + (entry.isOnline ? (entry.loadCurrent || 0) : 0);
          }, 0);
          return sumLog + logLoad;
        }, 0);

      dataPoints.push({
        day: dayName,
        output: dailyTotal,
        date: dateStr
      });
    }

    return dataPoints;
  }, [logs]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Unit Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map(unit => {
          const info = getLatestUnitInfo(unit);
          return (
            <UnitStatusCard 
              key={unit} 
              unitName={unit} 
              isOnline={info.isOnline} 
              currentLoad={info.loadCurrent}
            />
          );
        })}
      </div>

      {/* Total Load Card (Replaces previous static stats) */}
      <div className="grid grid-cols-1">
        <StatCard 
          title="Total Beban Pembangkit" 
          value={`${totalLoad.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MW`} 
          icon={<Activity />} 
          trend="Akumulasi Real-time dari Unit 1-4"
          color="bg-indigo-600"
        />
      </div>

      {/* Main Chart - Full Width */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Produktivitas Mingguan (Total Load)</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString('id-ID')} MW`, 'Total Beban']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="output" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOutput)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;