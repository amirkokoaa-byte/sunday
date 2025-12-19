
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AttendancePage from './components/AttendancePage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import MyLogsPage from './components/MyLogsPage';
import Login from './components/Login';
import Clock from './components/Clock';
import { AttendanceRecord, RecordType, Page, User, Theme } from './types';
import { getDayName } from './utils/dateUtils';
import { db, ref, onValue, set, push, remove, update } from './utils/firebase';

const STORAGE_KEY_THEME = 'attendance_theme_v4';

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

  const handleAddRecord = (type: RecordType, dateOverride?: Date, isPrivate: boolean = false, customName?: string) => {
    if (!user) return;
    const now = dateOverride || new Date();
    const recordsRef = ref(db, 'records');
    
    const newRecord = {
      userName: customName || user.username,
      date: now.toISOString(),
      dayName: getDayName(now),
      type,
      isPrivate
    };

    push(recordsRef, newRecord)
      .then(() => alert(`تم التسجيل بنجاح!`))
      .catch((err) => alert('خطأ في الاتصال بقاعدة البيانات'));
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

  const themeClasses = {
    light: 'bg-gray-50 text-gray-900',
    dark: 'bg-black text-white',
    glass: 'bg-gradient-to-br from-blue-600 to-indigo-900 text-white backdrop-blur-md',
    corporate: 'bg-slate-900 text-slate-100'
  }[theme];

  const cardClasses = theme === 'dark' 
    ? 'bg-zinc-950 border-zinc-800 shadow-none' 
    : theme === 'glass' ? 'bg-white/10 backdrop-blur-xl border-white/20' : 'bg-white border-gray-100 shadow-sm';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${themeClasses} ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar 
        currentPage={currentPage} setCurrentPage={setCurrentPage} 
        isOpen={sidebarOpen} setIsOpen={setSidebarOpen}
        user={user} onLogout={handleLogout}
      />

      <main className="flex-1 lg:mr-64 p-4 md:p-8">
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-6 rounded-3xl ${cardClasses}`}>
          <Clock />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <h1 className="text-xl font-black">حضور يوم السبت</h1>
              <p className="text-xs opacity-60">أهلاً، {user.username} {user.isAdmin ? '(مدير)' : ''}</p>
            </div>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2">☰</button>
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
              cardClasses={cardClasses}
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
              cardClasses={cardClasses}
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
              cardClasses={cardClasses}
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
              cardClasses={cardClasses}
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
