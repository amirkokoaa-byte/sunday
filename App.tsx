
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AttendancePage from './components/AttendancePage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import MyLogsPage from './components/MyLogsPage';
import LocationAttendancePage from './components/LocationAttendancePage';
import VacationRequestPage from './components/VacationRequestPage';
import AdminVacationRequestsPage from './components/AdminVacationRequestsPage';
import Login from './components/Login';
import Clock from './components/Clock';
import { AttendanceRecord, RecordType, Page, User, Theme } from './types';
import { getDayName } from './utils/dateUtils';
import { db, ref, onValue, push, remove, update } from './utils/firebase';

const STORAGE_KEY_THEME = 'attendance_theme_v5';

const DEFAULT_USERS: User[] = [
  { id: 'admin_root', username: 'admin', password: 'admin', isAdmin: true, department: 'الإدارة' }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('attendance');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [theme, setTheme] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [appName, setAppName] = useState('نظام الحضور الذكي');

  useEffect(() => {
    const configRef = ref(db, 'appConfig/name');
    const unsubscribeConfig = onValue(configRef, (snapshot) => {
      const name = snapshot.val();
      if (name) setAppName(name);
    });

    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: User[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        const hasAdmin = usersList.some(u => u.username === 'admin');
        setUsers(hasAdmin ? usersList : [...DEFAULT_USERS, ...usersList]);
        
        if (user) {
          const updatedUser = usersList.find(u => u.id === user.id);
          if (updatedUser) setUser(updatedUser);
        }
      } else {
        setUsers(DEFAULT_USERS);
      }
    });

    return () => {
      unsubscribeConfig();
      unsubscribeUsers();
    };
  }, [user?.id]);

  useEffect(() => {
    const recordsRef = ref(db, 'records');
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const recordsList: AttendanceRecord[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setRecords(recordsList);
      } else {
        setRecords([]);
      }
      setIsInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme) setTheme(savedTheme as Theme);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (theme === 'dark' || theme === 'midnight' || theme === 'corporate') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleAddRecord = (
    type: RecordType, 
    dateOverride?: Date, 
    isPrivate: boolean = false, 
    customName?: string,
    branchName?: string,
    locationLink?: string,
    accuracy?: number
  ) => {
    if (!user) return;
    const now = dateOverride || new Date();
    const recordsRef = ref(db, 'records');
    
    const newRecord = {
      userName: customName || user.username,
      department: user.department || 'عام',
      date: now.toISOString(),
      dayName: getDayName(now),
      type,
      isPrivate,
      branchName: branchName || null,
      locationLink: locationLink || null,
      accuracy: accuracy || null
    };

    push(recordsRef, newRecord);
  };

  const handleUpdateRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    const recordRef = ref(db, `records/${id}`);
    update(recordRef, updates);
  };

  const handleDeleteRecord = (id: string) => {
    if(confirm('هل انت متأكد من الحذف؟')) {
      const recordRef = ref(db, `records/${id}`);
      remove(recordRef);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('attendance');
  };

  if (!isInitialized) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="font-black text-xl italic animate-pulse">جاري تشغيل النظام...</div>
    </div>
  );

  if (!user) return <Login users={users} onLogin={setUser} appName={appName} />;

  const themeClasses: Record<Theme, string> = {
    light: 'bg-gray-50 text-gray-900',
    dark: 'bg-[#0a0a0a] text-zinc-100',
    glass: 'bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 text-white',
    corporate: 'bg-[#1a202c] text-slate-100',
    midnight: 'bg-[#020617] text-slate-100',
    emerald: 'bg-[#f0fdf4] text-emerald-950',
    rose: 'bg-[#fff1f2] text-rose-950'
  };

  const cardClasses: Record<Theme, string> = {
    light: 'bg-white border-gray-200/50 shadow-sm text-gray-900',
    dark: 'bg-zinc-900/50 backdrop-blur-md border-white/5 text-white shadow-none',
    glass: 'bg-white/10 backdrop-blur-2xl border-white/20 text-white shadow-2xl',
    corporate: 'bg-slate-800/80 border-slate-700 text-slate-100 shadow-md',
    midnight: 'bg-slate-900/60 backdrop-blur-md border-white/5 text-slate-100 shadow-2xl',
    emerald: 'bg-white border-emerald-100 text-emerald-900 shadow-md',
    rose: 'bg-white border-rose-100 text-rose-900 shadow-md'
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ease-in-out ${themeClasses[theme]} ${theme === 'dark' || theme === 'midnight' ? 'dark' : ''}`}>
      <Sidebar 
        currentPage={currentPage} setCurrentPage={setCurrentPage} 
        isOpen={sidebarOpen} setIsOpen={setSidebarOpen}
        user={user} onLogout={handleLogout}
        appName={appName}
      />

      <main className="flex-1 lg:mr-64 p-4 md:p-8 overflow-x-hidden">
        {/* Header المحسن */}
        <header className={`flex flex-col md:flex-row items-center justify-between gap-6 mb-10 p-6 rounded-[32px] relative border ${cardClasses[theme]} shadow-xl`}>
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-blue-500/10 rounded-2xl text-2xl hover:bg-blue-500/20 transition-colors">☰</button>
            <Clock />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right border-r-2 border-blue-500/30 pr-4 mr-2">
              <h1 className="text-xl font-black tracking-tight text-blue-600 dark:text-blue-400">{user.username}</h1>
              <div className="flex items-center justify-end gap-2 mt-1">
                <p className="text-[11px] font-black opacity-70 uppercase tracking-widest">{user.department || 'موظف'}</p>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95"
                title="تغيير الثيم"
              >
                <span className="text-xl">🎨</span>
              </button>
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-xl font-black shadow-lg">
                 {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
          {currentPage === 'attendance' && (
            <AttendancePage 
              records={records} 
              onAddRecord={(type) => handleAddRecord(type, undefined, false)} 
              onUpdateRecord={handleUpdateRecord}
              onDeleteRecord={handleDeleteRecord}
              user={user}
              users={users}
              cardClasses={cardClasses[theme]}
              theme={theme}
            />
          )}
          {currentPage === 'location-attendance' && (
            <LocationAttendancePage 
              user={user}
              onAddRecord={(type, branchName, locLink, acc) => handleAddRecord(type, undefined, false, undefined, branchName, locLink, acc)}
              cardClasses={cardClasses[theme]}
              theme={theme}
            />
          )}
          {currentPage === 'vacation-request' && (
            <VacationRequestPage 
              user={user}
              cardClasses={cardClasses[theme]}
              theme={theme}
            />
          )}
          {currentPage === 'admin-vacations' && (
            <AdminVacationRequestsPage 
              cardClasses={cardClasses[theme]}
              theme={theme}
              users={users}
            />
          )}
          {currentPage === 'my-logs' && (
            <MyLogsPage
              records={records}
              currentUserName={user.username}
              onAddRecord={(type, date) => handleAddRecord(type, date, true)}
              onDeleteRecord={handleDeleteRecord}
              onUpdateRecord={handleUpdateRecord}
              cardClasses={cardClasses[theme]}
              theme={theme}
            />
          )}
          {currentPage === 'history' && (
            <HistoryPage 
              records={records} 
              user={user}
              users={users}
              onAddManualRecord={(type, date, name) => handleAddRecord(type, date, false, name)}
              onDeleteRecord={handleDeleteRecord}
              onUpdateRecord={handleUpdateRecord}
              cardClasses={cardClasses[theme]}
              theme={theme}
            />
          )}
          {currentPage === 'settings' && user.isAdmin && (
            <SettingsPage 
              users={users}
              onAddUser={(ud) => push(ref(db, 'users'), ud)}
              onUpdateUser={(id, up) => update(ref(db, `users/${id}`), up)}
              onDeleteUser={(id) => remove(ref(db, `users/${id}`))}
              currentTheme={theme}
              onThemeChange={setTheme}
              cardClasses={cardClasses[theme]}
              theme={theme}
              appName={appName}
            />
          )}
        </div>

        <footer className="text-center py-10 opacity-40 text-[10px] border-t border-white/5 mt-16 font-bold tracking-widest">
           {appName} &bull; 2024 &bull; نظام الحضور والإنصراف الذكي
        </footer>
      </main>
    </div>
  );
};

export default App;
