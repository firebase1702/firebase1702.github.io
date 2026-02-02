import React, { useState, useRef } from 'react';
import { ShiftLog, ShiftChecklist } from '../types';
import { Search, Calendar, Users, Wrench, Clock, X, ArrowRight, Trash2, AlertCircle } from 'lucide-react';

interface ShiftHistoryProps {
  logs: ShiftLog[];
  onDeleteLog: (id: string) => void;
  isAdmin?: boolean;
}

const ShiftHistory: React.FC<ShiftHistoryProps> = ({ logs, onDeleteLog, isAdmin = false }) => {
  const [filter, setFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Refs to programmatically trigger the calendar picker
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const filteredLogs = logs.filter(log => {
    // 1. Text Search Filter
    const matchesText = log.groupName.toLowerCase().includes(filter.toLowerCase()) ||
                        log.unitGroup.toLowerCase().includes(filter.toLowerCase()) ||
                        (log.userEmail || '').toLowerCase().includes(filter.toLowerCase());

    // 2. Date Range Filter
    const logDate = log.date.split('T')[0]; // Extract YYYY-MM-DD
    let matchesDate = true;

    if (startDate) {
      matchesDate = matchesDate && logDate >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && logDate <= endDate;
    }

    return matchesText && matchesDate;
  });

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const showDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      try {
        if (typeof ref.current.showPicker === 'function') {
          ref.current.showPicker();
        } else {
          ref.current.focus();
        }
      } catch (err) {
        console.warn("Date picker not supported or blocked", err);
        ref.current.focus();
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteLog(deletingId);
      setDeletingId(null);
    }
  };

  const getChecklistLabel = (key: string): string => {
    const labels: Record<string, string> = {
      pemanasanEDG: 'Pemanasan EDG',
      housekeeping: 'Housekeeping',
      pemanasanFirefighting: 'Pemanasan Firefighting',
      drainKompresor: 'Drain Kompresor',
      purifierOliUnit1: 'Purifier Oli U1',
      purifierOliUnit2: 'Purifier Oli U2',
      engkolManualTurbinUnit1: 'Engkol Turbin U1',
      engkolManualTurbinUnit2: 'Engkol Turbin U2',
      drainSeparator: 'Drain Separator',
      penambahanNaOHUnit3: 'Tambah NaOH U3',
      penambahanNaOHUnit4: 'Tambah NaOH U4',
    };
    return labels[key] || key;
  };

  const renderChecklist = (checklist: ShiftChecklist) => {
    return Object.entries(checklist).map(([key, value]) => {
      if (!value) return null;
      return (
        <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 mr-1 mb-1">
          {getChecklistLabel(key)}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Riwayat Laporan</h2>
          <p className="text-slate-500 mt-1">Arsip lengkap aktivitas operasional per grup.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
            <Calendar 
              className="w-4 h-4 text-slate-400 mr-2 cursor-pointer hover:text-blue-500 transition-colors" 
              onClick={() => showDatePicker(startDateRef)}
            />
            <input
              ref={startDateRef}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border-none outline-none text-slate-600 bg-transparent w-full md:w-32 placeholder-slate-400 cursor-pointer"
              placeholder="Dari"
            />
            <ArrowRight className="w-3 h-3 text-slate-300 mx-2" />
            <input
              ref={endDateRef}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm border-none outline-none text-slate-600 bg-transparent w-full md:w-32 placeholder-slate-400 cursor-pointer"
              placeholder="Sampai"
            />
            {(startDate || endDate) && (
              <button 
                onClick={clearDateFilter}
                className="ml-2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                title="Hapus Filter Tanggal"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative group flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={isAdmin ? "Cari grup, unit, atau operator..." : "Cari grup atau unit..."}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none w-full md:w-64 transition-all bg-white text-slate-900 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
                {isAdmin && <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Operator</th>}
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Grup</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Unit Group</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Status & Beban</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Catatan</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap align-top">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">{new Date(log.date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="text-xs text-slate-400 pl-6 mt-0.5">{log.shift}</div>
                      {log.checklist && (
                        <div className="pl-6 mt-2 max-w-[200px] flex flex-wrap">
                           {renderChecklist(log.checklist)}
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6 text-sm text-slate-600 align-top">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]" title={log.userEmail}>{log.userEmail || '-'}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-4 px-6 text-sm text-slate-700 font-medium align-top">
                      <div className="flex items-center gap-2">
                        {log.groupName}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 align-top">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-700">{log.unitGroup}</span>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="flex flex-col gap-2">
                        {log.entries.map(entry => (
                          <div key={entry.unitId} className="flex items-center justify-between gap-3 text-xs bg-white border border-slate-100 p-2 rounded-lg shadow-sm">
                             <span className="text-slate-700 font-bold">{entry.unitId}</span>
                             {entry.isOnline ? (
                               <div className="text-right">
                                  <div className="flex items-center justify-end gap-1 mb-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-slate-800 font-bold font-mono text-sm">{entry.loadCurrent} MW</span>
                                  </div>
                                  <div className="text-slate-400 font-mono text-[10px]">Range: {entry.loadLowest}-{entry.loadHighest}</div>
                               </div>
                             ) : (
                               <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">OFFLINE</span>
                             )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 align-top">
                      <div className="flex flex-col gap-2">
                         {log.entries.map(entry => (
                           <div key={entry.unitId} className="min-h-[2rem] flex items-center">
                             {entry.isOnline ? (
                               <span className="truncate" title={entry.notes}>{entry.notes || '-'}</span>
                             ) : (
                               <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                 {entry.offlineReason === 'Maintenance' ? <Wrench className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                                 <span className="text-xs font-semibold uppercase">{entry.offlineReason || 'Tidak Diketahui'}</span>
                               </div>
                             )}
                           </div>
                         ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right align-top">
                      <button 
                        onClick={() => handleDeleteClick(log.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data laporan yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Laporan?</h3>
              <p className="text-slate-500 mb-6 text-sm">
                Tindakan ini tidak dapat dibatalkan. Data laporan akan hilang secara permanen.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftHistory;