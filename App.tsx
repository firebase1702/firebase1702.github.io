import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc, getDoc, where } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ShiftEntry from './components/ShiftEntry';
import ShiftHistory from './components/ShiftHistory';
import SOPList from './components/SOPList';
import Login from './components/Login';
import { AppView, ShiftLog } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [logs, setLogs] = useState<ShiftLog[]>([]);

  // Auth & Role Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check Role
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
            // Default view for admin
            if (currentView === AppView.ENTRY) setCurrentView(AppView.DASHBOARD); 
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener for Shift Logs
  useEffect(() => {
    // Only proceed if user is logged in and auth check is done
    if (!user || authLoading) {
      setLogs([]);
      return;
    }

    const logsRef = collection(db, "laporan_shift");
    let q;

    if (isAdmin) {
      // Admin Rule: allow read: if isAdmin();
      // Admin sees ALL reports from the root collection
      q = query(logsRef);
    } else {
      // User Rule: allow read: if resource.data.createdBy == request.auth.uid;
      // User must filter by their own UID to satisfy the rule (and UI logic)
      q = query(logsRef, where("createdBy", "==", user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs: ShiftLog[] = [];
      snapshot.forEach((doc) => {
        fetchedLogs.push(doc.data() as ShiftLog);
      });
      // Sort logs by date descending (client-side sort)
      fetchedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLogs(fetchedLogs);
    }, (error) => {
      console.error("Error fetching shift logs:", error);
      if (error.code === 'permission-denied') {
         alert("Izin ditolak. Anda tidak memiliki akses ke data ini.");
      }
    });

    return () => unsubscribe();
  }, [user, isAdmin, authLoading]);

  const handleAddLog = async (newLog: ShiftLog) => {
    if (!user) return;
    try {
      // Rule Requirement: allow create: if isSignedIn();
      // We must add createdBy matching auth.uid so the User can read/update it later
      const logWithMeta = { 
        ...newLog, 
        userEmail: user.email || 'Unknown',
        createdBy: user.uid 
      };
      
      // Save to root collection 'laporan_shift'
      await setDoc(doc(db, "laporan_shift", newLog.id), logWithMeta);
      setCurrentView(AppView.DASHBOARD);
    } catch (error) {
      console.error("Error adding log:", error);
      alert("Gagal menyimpan laporan. Silakan coba lagi.");
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!user) return;
    try {
      // Rule Requirement: allow delete: if isAdmin() || resource.data.createdBy == request.auth.uid;
      await deleteDoc(doc(db, "laporan_shift", id));
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("Gagal menghapus laporan.");
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard logs={logs} />;
      case AppView.ENTRY:
        return <ShiftEntry onAddLog={handleAddLog} />;
      case AppView.HISTORY:
        return <ShiftHistory logs={logs} onDeleteLog={handleDeleteLog} isAdmin={isAdmin} />;
      case AppView.SOP:
        return <SOPList user={user} isAdmin={isAdmin} />;
      default:
        return <Dashboard logs={logs} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView} isAdmin={isAdmin}>
      {renderContent()}
    </Layout>
  );
};

export default App;