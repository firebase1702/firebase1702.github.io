import React, { useState, useEffect } from 'react';
import { Send, CheckSquare, Power, Clock, Wrench, Sun, Droplets, RotateCw, FlaskConical, Trash2, Flame, FileText, AlertCircle } from 'lucide-react';
import { ShiftLog, ShiftType, UnitEntry, ShiftChecklist } from '../types';

interface ShiftEntryProps {
  onAddLog: (log: ShiftLog) => void;
}

// Local interface to handle form inputs where numbers can be empty strings temporarily
type FormUnitEntry = Omit<UnitEntry, 'loadCurrent' | 'loadLowest' | 'loadHighest'> & {
  loadCurrent: number | '';
  loadLowest: number | '';
  loadHighest: number | '';
};

const ShiftEntry: React.FC<ShiftEntryProps> = ({ onAddLog }) => {
  const [groupName, setGroupName] = useState('');
  const [shift, setShift] = useState<ShiftType>('Pagi');
  const [selectedUnitGroup, setSelectedUnitGroup] = useState<'Unit 1-2' | 'Unit 3-4'>('Unit 1-2');
  const [commonNotes, setCommonNotes] = useState(''); // New state for merged notes
  const [showConfirmation, setShowConfirmation] = useState(false); // Confirmation modal state
  
  // Checklist State
  const [checklist, setChecklist] = useState<ShiftChecklist>({
    pemanasanEDG: false,
    housekeeping: false,
    pemanasanFirefighting: false,
    drainKompresor: false,
    purifierOliUnit1: false,
    purifierOliUnit2: false,
    engkolManualTurbinUnit1: false,
    engkolManualTurbinUnit2: false,
    drainSeparator: false,
    penambahanNaOHUnit3: false,
    penambahanNaOHUnit4: false
  });

  // Units State - Initialize with empty strings instead of 0 for loads
  const [unitEntries, setUnitEntries] = useState<FormUnitEntry[]>([
    { unitId: 'Unit 1', isOnline: true, loadCurrent: '', loadLowest: '', loadHighest: '', notes: '' },
    { unitId: 'Unit 2', isOnline: true, loadCurrent: '', loadLowest: '', loadHighest: '', notes: '' }
  ]);

  // Update unit entries when group changes
  useEffect(() => {
    if (selectedUnitGroup === 'Unit 1-2') {
      setUnitEntries([
        { unitId: 'Unit 1', isOnline: true, loadCurrent: '', loadLowest: '', loadHighest: '', notes: '' },
        { unitId: 'Unit 2', isOnline: true, loadCurrent: '', loadLowest: '', loadHighest: '', notes: '' }
      ]);
    } else {
      setUnitEntries([
        { unitId: 'Unit 3', isOnline: true, loadCurrent: '', loadLowest: '', loadHighest: '', notes: '' },
        { unitId: 'Unit 4', isOnline: true, loadCurrent: '', loadLowest: '', loadHighest: '', notes: '' }
      ]);
    }
    setCommonNotes(''); // Reset common notes
    
    // Reset checklist on group change to avoid confusion
    setChecklist({
      pemanasanEDG: false,
      housekeeping: false,
      pemanasanFirefighting: false,
      drainKompresor: false,
      purifierOliUnit1: false,
      purifierOliUnit2: false,
      engkolManualTurbinUnit1: false,
      engkolManualTurbinUnit2: false,
      drainSeparator: false,
      penambahanNaOHUnit3: false,
      penambahanNaOHUnit4: false
    });
  }, [selectedUnitGroup]);

  const handleUnitChange = (index: number, field: keyof FormUnitEntry, value: any) => {
    const newEntries = [...unitEntries];
    // Cast value to any to satisfy the index signature constraint for this update
    (newEntries[index] as any)[field] = value;
    
    // Logic when switching Online/Offline
    if (field === 'isOnline') {
      if (value === false) {
        // Default to Standby when turned off
        newEntries[index].offlineReason = 'Standby';
      } else {
        // Clear offline reason when turned on
        newEntries[index].offlineReason = undefined;
      }
    }
    
    setUnitEntries(newEntries);
  };

  const handleLoadBlur = (index: number, field: keyof FormUnitEntry) => {
    const newEntries = [...unitEntries];
    const val = newEntries[index][field];
    
    // Automatically divide by 1000 if value is > 500
    if (typeof val === 'number' && val > 500) {
       (newEntries[index] as any)[field] = val / 1000;
       setUnitEntries(newEntries);
    }
  };

  const handleChecklistChange = (key: keyof ShiftChecklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = () => {
    // Filter checklist logic (same as before)
    const relevantChecklist: ShiftChecklist = {};
    const isPagi = shift === 'Pagi';

    if (selectedUnitGroup === 'Unit 1-2') {
       if (isPagi) {
         relevantChecklist.pemanasanEDG = checklist.pemanasanEDG;
         relevantChecklist.housekeeping = checklist.housekeeping;
         relevantChecklist.pemanasanFirefighting = checklist.pemanasanFirefighting;
         relevantChecklist.drainKompresor = checklist.drainKompresor;
       }
       relevantChecklist.purifierOliUnit1 = checklist.purifierOliUnit1;
       relevantChecklist.purifierOliUnit2 = checklist.purifierOliUnit2;
       relevantChecklist.engkolManualTurbinUnit1 = checklist.engkolManualTurbinUnit1;
       relevantChecklist.engkolManualTurbinUnit2 = checklist.engkolManualTurbinUnit2;
    } else {
       if (isPagi) {
         relevantChecklist.pemanasanEDG = checklist.pemanasanEDG;
         relevantChecklist.housekeeping = checklist.housekeeping;
         relevantChecklist.pemanasanFirefighting = checklist.pemanasanFirefighting;
         relevantChecklist.drainSeparator = checklist.drainSeparator;
       }
       relevantChecklist.penambahanNaOHUnit3 = checklist.penambahanNaOHUnit3;
       relevantChecklist.penambahanNaOHUnit4 = checklist.penambahanNaOHUnit4;
    }

    // Convert FormUnitEntry back to strict UnitEntry AND apply common notes
    const processedEntries: UnitEntry[] = unitEntries.map(u => ({
      ...u,
      loadCurrent: u.loadCurrent === '' ? 0 : u.loadCurrent,
      loadLowest: u.loadLowest === '' ? 0 : u.loadLowest,
      loadHighest: u.loadHighest === '' ? 0 : u.loadHighest,
      notes: commonNotes // Apply the shared note to both units for data consistency
    }));

    const newLog: ShiftLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      groupName: groupName,
      shift: shift,
      unitGroup: selectedUnitGroup,
      entries: processedEntries,
      checklist: relevantChecklist,
    };

    onAddLog(newLog);
    
    // Reset form
    setShowConfirmation(false);
    setGroupName('');
    setCommonNotes('');
    setUnitEntries(prev => prev.map(u => ({ 
      ...u, 
      isOnline: true, 
      loadCurrent: '', 
      loadLowest: '', 
      loadHighest: '', 
      notes: '', 
      offlineReason: undefined 
    })));
    setChecklist({
        pemanasanEDG: false,
        housekeeping: false,
        pemanasanFirefighting: false,
        drainKompresor: false,
        purifierOliUnit1: false,
        purifierOliUnit2: false,
        engkolManualTurbinUnit1: false,
        engkolManualTurbinUnit2: false,
        drainSeparator: false,
        penambahanNaOHUnit3: false,
        penambahanNaOHUnit4: false
    });
  };

  const inputNumberClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  const TaskToggle = ({ label, id, icon: Icon, activeColor = "bg-blue-600 border-blue-600 text-white" }: any) => (
    <button
      type="button"
      onClick={() => handleChecklistChange(id)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border shadow-sm
        ${checklist[id] 
          ? `${activeColor} shadow-md` 
          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
        }`}
    >
      <Icon size={14} className={checklist[id] ? 'text-white' : 'text-slate-400'} />
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Laporan Shift Operasional</h2>
        <p className="text-slate-500 mt-1">Input data per grup unit (1-2 atau 3-4).</p>
      </div>

      <form onSubmit={handlePreSubmit} className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nama Grup</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                placeholder="Ex: Grup A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
              >
                <option value="Pagi">Pagi (08:00 - 15:00)</option>
                <option value="Sore">Sore (15:00 - 23:00)</option>
                <option value="Malam">Malam (23:00 - 08:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Area Unit</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {['Unit 1-2', 'Unit 3-4'].map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedUnitGroup(grp as any)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedUnitGroup === grp 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Checklist Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 animate-fade-in">
          {shift === 'Pagi' && (
            <div className="pb-5 border-b border-slate-100">
               <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sun className="w-4 h-4" /> Rutinitas Pagi
              </h3>
              <div className="flex flex-wrap gap-2">
                <TaskToggle id="pemanasanEDG" label="Pemanasan EDG" icon={Power} activeColor="bg-amber-500 border-amber-500 text-white" />
                <TaskToggle id="housekeeping" label="Housekeeping" icon={Trash2} activeColor="bg-amber-500 border-amber-500 text-white" />
                <TaskToggle id="pemanasanFirefighting" label="Pemanasan Firefighting" icon={Flame} activeColor="bg-amber-500 border-amber-500 text-white" />
                {selectedUnitGroup === 'Unit 1-2' && (
                   <TaskToggle id="drainKompresor" label="Drain Kompresor & Demister" icon={Droplets} activeColor="bg-amber-500 border-amber-500 text-white" />
                )}
                {selectedUnitGroup === 'Unit 3-4' && (
                   <TaskToggle id="drainSeparator" label="Drain Separator" icon={Droplets} activeColor="bg-amber-500 border-amber-500 text-white" />
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Checklist Operasional Unit
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedUnitGroup === 'Unit 1-2' && (
                <>
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded border border-slate-100 mr-2">
                    <span className="text-[10px] font-bold text-slate-400">UNIT 1</span>
                    <TaskToggle id="purifierOliUnit1" label="Purifier Oli" icon={Droplets} />
                    <TaskToggle id="engkolManualTurbinUnit1" label="Engkol Manual" icon={RotateCw} />
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400">UNIT 2</span>
                    <TaskToggle id="purifierOliUnit2" label="Purifier Oli" icon={Droplets} />
                    <TaskToggle id="engkolManualTurbinUnit2" label="Engkol Manual" icon={RotateCw} />
                  </div>
                </>
              )}
              {selectedUnitGroup === 'Unit 3-4' && (
                <>
                   <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded border border-slate-100 mr-2">
                    <span className="text-[10px] font-bold text-slate-400">UNIT 3</span>
                    <TaskToggle id="penambahanNaOHUnit3" label="Tambah NaOH" icon={FlaskConical} />
                  </div>
                   <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400">UNIT 4</span>
                    <TaskToggle id="penambahanNaOHUnit4" label="Tambah NaOH" icon={FlaskConical} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Unit Forms Split - Loads and Status Only */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {unitEntries.map((unit, index) => (
            <div key={unit.unitId} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${unit.isOnline ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className={`px-6 py-4 border-b flex justify-between items-center ${unit.isOnline ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`font-bold text-lg ${unit.isOnline ? 'text-emerald-800' : 'text-slate-500'}`}>{unit.unitId}</h3>
                
                <label className="inline-flex items-center cursor-pointer gap-3 relative group">
                  <span className={`text-xs font-bold uppercase transition-colors duration-300 ${unit.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {unit.isOnline ? 'Unit Online' : 'Unit Offline'}
                  </span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={unit.isOnline}
                      onChange={(e) => handleUnitChange(index, 'isOnline', e.target.checked)}
                    />
                    <div className={`w-14 h-8 rounded-full shadow-inner transition-colors duration-300 ease-in-out ${unit.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${unit.isOnline ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="p-6 space-y-5">
                {unit.isOnline ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Beban Saat Ini (MW)</label>
                      <input
                        type="number"
                        value={unit.loadCurrent}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUnitChange(index, 'loadCurrent', val === '' ? '' : parseFloat(val));
                        }}
                        onBlur={() => handleLoadBlur(index, 'loadCurrent')}
                        className={inputNumberClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Beban Min (MW)</label>
                      <input
                        type="number"
                        value={unit.loadLowest}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUnitChange(index, 'loadLowest', val === '' ? '' : parseFloat(val));
                        }}
                        onBlur={() => handleLoadBlur(index, 'loadLowest')}
                        className={inputNumberClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Beban Max (MW)</label>
                      <input
                        type="number"
                        value={unit.loadHighest}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUnitChange(index, 'loadHighest', val === '' ? '' : parseFloat(val));
                        }}
                        onBlur={() => handleLoadBlur(index, 'loadHighest')}
                        className={inputNumberClass}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Status Unit Offline</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['Standby', 'Maintenance'] as const).map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => handleUnitChange(index, 'offlineReason', reason)}
                          className={`py-3 px-4 rounded-xl border font-medium text-sm transition-all flex items-center justify-center gap-2
                            ${unit.offlineReason === reason
                              ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-[1.02]'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                        >
                          {reason === 'Standby' ? <Clock className="w-4 h-4"/> : <Wrench className="w-4 h-4"/>}
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Common Notes Section (Merged for both units) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
             <FileText className="w-4 h-4 text-blue-500" />
             Catatan Operasional Gabungan ({selectedUnitGroup})
          </label>
          <textarea
            rows={4}
            value={commonNotes}
            onChange={(e) => setCommonNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 text-slate-900 placeholder-slate-400"
            placeholder={`Masukkan log aktivitas, anomali, atau catatan penting untuk ${selectedUnitGroup} secara keseluruhan...`}
          ></textarea>
        </div>

        {/* Footer Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex justify-end">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-medium transition-all transform active:scale-95 shadow-lg shadow-slate-200"
          >
            <Send className="w-4 h-4" />
            Kirim Laporan
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Pengiriman</h3>
              <p className="text-slate-500 mb-6">
                Apakah Anda yakin data laporan <strong>{groupName}</strong> untuk <strong>{shift}</strong> sudah benar? Data yang dikirim tidak dapat diubah kembali.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                >
                  Ya, Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftEntry;