
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AttendancePage from './components/AttendancePage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import Login from './components/Login';
import Clock from './components/Clock';
import { AttendanceRecord, RecordType, Page, User, Theme } from './types';
import { getDayName } from './utils/dateUtils';

const STORAGE_KEY_RECORDS = 'attendance_records_v3';
const STORAGE_KEY_USERS = 'attendance_users_v3';
const STORAGE_KEY_THEME = 'attendance_theme_v3';

// Updated admin credentials as per user request: admin / admin
const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', password: 'admin', isAdmin: true }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('attendance');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [theme, setTheme] = useState<Theme>('light');

  // Initialization
  useEffect(() => {
    const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(DEFAULT_USERS);
    }

    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme) setTheme(savedTheme as Theme);
  }, []);

  // Syncing
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  const handleAddRecord = (type: RecordType) => {
    if (!user) return;
    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.username,
      date: now.toISOString(),
      dayName: getDayName(now),
      type,
    };
    setRecords(prev => [newRecord, ...prev]);
    alert(`تم تسجيل ${type} بنجاح!`);
  };

  const handleAddUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: userData.username || 'user',
      password: userData.password || '123',
      isAdmin: false
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const handleDeleteUser = (id: string) => {
    if(confirm('هل انت متأكد من حذف هذا المستخدم؟')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('attendance');
  };

  if (!user) {
    return <Login users={users} onLogin={setUser} />;
  }

  // Theme styles
  const themeClasses = {
    light: 'bg-gray-50 text-gray-900',
    dark: 'bg-black text-white', // Dark: white text on black background
    glass: 'bg-gradient-to-br from-blue-600 to-indigo-900 text-white backdrop-blur-md',
    corporate: 'bg-slate-900 text-slate-100'
  }[theme];

  const cardClasses = theme === 'dark' 
    ? 'bg-zinc-950 border-zinc-800 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
    : theme === 'glass'
    ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl'
    : 'bg-white border-gray-100 text-gray-900 shadow-sm';

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${themeClasses}`}>
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 lg:mr-64 p-4 md:p-8 overflow-y-auto">
        {/* Universal Header */}
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-6 rounded-3xl ${cardClasses}`}>
          {/* Top Left: Clock & Date */}
          <Clock />

          {/* Top Right: Mobile Toggle & Title */}
          <div className="flex items-center gap-4 order-first md:order-last">
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-black">حضور يوم السبت</h1>
              <p className="text-xs opacity-60">أهلاً بك، {user.username}</p>
            </div>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 bg-blue-500 text-white rounded-2xl shadow-lg active:scale-90 transition-all"
            >
              <span className="text-2xl">☰</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="max-w-6xl mx-auto space-y-6">
          {currentPage === 'attendance' && (
            <AttendancePage 
              records={records} 
              onAddRecord={handleAddRecord} 
              currentUserName={user.username}
              cardClasses={cardClasses}
              theme={theme}
            />
          )}
          {currentPage === 'history' && (
            <HistoryPage 
              records={records} 
              onDeleteRecord={handleDeleteRecord}
              onUpdateRecord={handleUpdateRecord}
              cardClasses={cardClasses}
              theme={theme}
            />
          )}
          {currentPage === 'settings' && user.isAdmin && (
            <SettingsPage 
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              currentTheme={theme}
              onThemeChange={setTheme}
              cardClasses={cardClasses}
              theme={theme}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
