
export type ShiftType = 'Pagi' | 'Sore' | 'Malam';

export interface ShiftChecklist {
  // Common / Pagi Rutinitas
  pemanasanEDG?: boolean;
  housekeeping?: boolean;
  pemanasanFirefighting?: boolean;
  
  // Unit 1-2 Specific
  drainKompresor?: boolean; 
  purifierOliUnit1?: boolean;      // Changed: Specific Unit 1
  purifierOliUnit2?: boolean;      // Changed: Specific Unit 2
  engkolManualTurbinUnit1?: boolean; // Changed: Specific Unit 1
  engkolManualTurbinUnit2?: boolean; // Changed: Specific Unit 2
  
  // Unit 3-4 Specific
  drainSeparator?: boolean;     // Replaces drainKompresor for U3-4
  penambahanNaOHUnit3?: boolean; // New: Unit 3-4 All Shifts
  penambahanNaOHUnit4?: boolean; // New: Unit 3-4 All Shifts
}

export interface UnitEntry {
  unitId: string;
  isOnline: boolean;     // Replaces 'status' dropdown
  loadCurrent: number;   // New field: Beban Saat Ini
  loadLowest: number;    // Field: Beban Terendah
  loadHighest: number;   // Field: Beban Tertinggi
  notes: string;
  offlineReason?: 'Standby' | 'Maintenance'; // Field for offline status
}

export interface ShiftLog {
  id: string;
  date: string;
  shift: ShiftType;
  groupName: string;
  unitGroup: 'Unit 1-2' | 'Unit 3-4';
  entries: UnitEntry[];
  checklist?: ShiftChecklist; // Renamed from morningChecklist
  aiAnalysis?: string;
  userEmail?: string; // To track who submitted the log
  createdBy?: string; // UID for security rules check
}

export type SOPTargetUnit = 'Unit 1-2' | 'Unit 3-4' | 'Umum';

export interface SOP {
  id: string;
  title: string;
  category: string;
  targetUnit: SOPTargetUnit; // New field for unit categorization
  lastUpdated: string;
  content: string;
  fileUrl?: string; // URL for the document file (blob or external)
  userEmail?: string; // Uploader
  path?: string; // Firestore path for deletion (Admin use)
}

export interface DashboardStats {
  totalShifts: number;
  efficiencyRate: number;
  incidents: number;
  outputTrend: { day: string; output: number }[];
}

export enum AppView {
  DASHBOARD = 'dashboard',
  ENTRY = 'entry',
  HISTORY = 'history',
  SOP = 'sop'
}
