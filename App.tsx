
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AttendancePage from './components/AttendancePage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import MyLogsPage from './components/MyLogsPage';
import LocationAttendancePage from './components/LocationAttendancePage';
import Login from './components/Login';
import Clock from './components/Clock';
import { AttendanceRecord, RecordType, Page, User, Theme } from './types';
import { getDayName } from './utils/dateUtils';
import { db, ref, onValue, push, remove, update } from './utils/firebase';

const STORAGE_KEY_THEME = 'attendance_theme_v5';

const DEFAULT_USERS: User[] = [
  { id: 'admin_root', username: 'admin', password: 'admin', isAdmin: true }
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

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: User[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        const hasAdmin = usersList.some(u => u.username === 'admin');
        setUsers(hasAdmin ? usersList : [...DEFAULT_USERS, ...usersList]);
      } else {
        setUsers(DEFAULT_USERS);
      }
    });
    return () => unsubscribe();
  }, []);

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
      date: now.toISOString(),
      dayName: getDayName(now),
      type,
      isPrivate,
      branchName: branchName || null,
      locationLink: locationLink || null,
      accuracy: accuracy || null
    };

    push(recordsRef, newRecord)
      .then(() => alert(`تم التسجيل بنجاح!`))
      .catch(() => alert('خطأ في الاتصال بقاعدة البيانات'));
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

  if (!isInitialized) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold">جاري الاتصال...</div>;

  if (!user) return <Login users={users} onLogin={setUser} />;

  const themeClasses: Record<Theme, string> = {
    light: 'bg-gray-50 text-gray-900',
    dark: 'bg-black text-white',
    glass: 'bg-gradient-to-br from-blue-600 to-indigo-900 text-white backdrop-blur-md',
    corporate: 'bg-slate-900 text-slate-100',
    midnight: 'bg-slate-950 text-slate-100',
    emerald: 'bg-emerald-50 text-emerald-950',
    rose: 'bg-rose-50 text-rose-950'
  };

  const cardClasses: Record<Theme, string> = {
    light: 'bg-white border-gray-100 shadow-sm text-gray-900',
    dark: 'bg-zinc-950 border-zinc-800 text-white shadow-none',
    glass: 'bg-white/10 backdrop-blur-xl border-white/20 text-white',
    corporate: 'bg-slate-800 border-slate-700 text-slate-100',
    midnight: 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl',
    emerald: 'bg-white border-emerald-100 text-emerald-900 shadow-md',
    rose: 'bg-white border-rose-100 text-rose-900 shadow-md'
  };

  const themeOptions: { id: Theme; label: string; icon: string }[] = [
    { id: 'light', label: 'فاتح', icon: '☀️' },
    { id: 'dark', label: 'داكن', icon: '🌙' },
    { id: 'glass', label: 'زجاجي', icon: '❄️' },
    { id: 'corporate', label: 'رسمي', icon: '💼' },
    { id: 'midnight', label: 'ليلي', icon: '🌌' },
    { id: 'emerald', label: 'زمردي', icon: '🌿' },
    { id: 'rose', label: 'زهري', icon: '🌸' }
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${themeClasses[theme]} ${theme === 'dark' || theme === 'midnight' ? 'dark' : ''}`}>
      <Sidebar 
        currentPage={currentPage} setCurrentPage={setCurrentPage} 
        isOpen={sidebarOpen} setIsOpen={setSidebarOpen}
        user={user} onLogout={handleLogout}
      />

      <main className="flex-1 lg:mr-64 p-4 md:p-8">
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-6 rounded-3xl relative ${cardClasses[theme]}`}>
          <Clock />
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <span>🎨 الاستايل</span>
                <span className="text-xs">▼</span>
              </button>
              
              {showThemeMenu && (
                <div className={`absolute top-full mt-2 left-0 w-48 rounded-2xl p-2 z-50 shadow-2xl border ${cardClasses[theme]} overflow-hidden`}>
                  <div className="grid grid-cols-1 gap-1">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setTheme(opt.id);
                          setShowThemeMenu(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl text-right transition-colors ${theme === opt.id ? 'bg-blue-600 text-white' : 'hover:bg-blue-500/10'}`}
                      >
                        <span>{opt.icon}</span>
                        <span className="text-sm font-bold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right">
              <h1 className="text-xl font-black">حضور يوم السبت</h1>
              <p className="text-xs opacity-60">أهلاً، {user.username}</p>
            </div>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-2xl">☰</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6 pb-20 text-right" dir="rtl">
          {currentPage === 'attendance' && (
            <AttendancePage 
              records={records} 
              onAddRecord={(type) => handleAddRecord(type, undefined, false)} 
              onUpdateRecord={handleUpdateRecord}
              onDeleteRecord={handleDeleteRecord}
              user={user}
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
            />
          )}
        </div>
        <footer className="text-center py-8 opacity-50 text-sm border-t border-white/10 mt-10">
          مع تحيات المطور Amir Lamay
        </footer>
      </main>
    </div>
  );
};

export default App;
