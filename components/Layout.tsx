import React, { useState } from 'react';
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { 
  LayoutDashboard, 
  FileEdit, 
  History, 
  BookOpen, 
  Menu, 
  X, 
  LogOut,
  UserCircle,
  Shield
} from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  children: React.ReactNode;
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children, isAdmin = false }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Define nav items
  const allNavItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.ENTRY, label: 'Laporan Shift', icon: FileEdit },
    { id: AppView.HISTORY, label: 'Riwayat Laporan', icon: History },
    { id: AppView.SOP, label: 'Daftar SOP', icon: BookOpen },
  ];

  // Filter based on Role
  const navItems = isAdmin 
    ? allNavItems.filter(item => item.id !== AppView.ENTRY) // Admin: No Entry
    : allNavItems; // User: All

  const handleNavClick = (view: AppView) => {
    onChangeView(view);
    setSidebarOpen(false); // Close sidebar on mobile after click
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-lg font-bold text-slate-800">Digital Logbook</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Menu Utama</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
                  ${currentView === item.id 
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-blue-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                {isAdmin ? <Shield className="w-6 h-6" /> : <UserCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{auth.currentUser?.email || 'Operator'}</p>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                  {isAdmin ? 'Administrator' : 'Operator'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden md:block text-right">
              <p className="text-xs text-slate-400 font-medium">Waktu Sekarang</p>
              <p className="text-sm font-bold text-slate-700 font-mono">
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
              SISTEM NORMAL
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;