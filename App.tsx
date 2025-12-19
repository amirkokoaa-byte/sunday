
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

  // 1. مزامنة المستخدمين من Firebase
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: User[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        // نضمن دائماً وجود الأدمن
        const hasAdmin = usersList.some(u => u.username === 'admin');
        setUsers(hasAdmin ? usersList : [...DEFAULT_USERS, ...usersList]);
      } else {
        setUsers(DEFAULT_USERS);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. مزامنة سجلات الحضور من Firebase
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

  // 3. تحميل الثيم (محلي فقط لكل جهاز)
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme) setTheme(savedTheme as Theme);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  const handleAddRecord = (type: RecordType, dateOverride?: Date) => {
    if (!user) return;
    const now = dateOverride || new Date();
    const recordsRef = ref(db, 'records');
    
    const newRecord = {
      userName: user.username,
      date: now.toISOString(),
      dayName: getDayName(now),
      type,
    };

    push(recordsRef, newRecord)
      .then(() => alert(`تم تسجيل ${type} بنجاح!`))
      .catch((err) => alert('خطأ في الاتصال بقاعدة البيانات'));
  };

  const handleAddUser = (userData: Partial<User>) => {
    const usersRef = ref(db, 'users');
    const newUser = {
      username: userData.username || 'user',
      password: userData.password || '123',
      isAdmin: false
    };
    push(usersRef, newUser);
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    const userRef = ref(db, `users/${id}`);
    update(userRef, updates);
  };

  const handleDeleteUser = (id: string) => {
    if(id === 'admin_root') return alert('لا يمكن حذف المدير الرئيسي');
    if(confirm('هل انت متأكد من حذف هذا المستخدم؟')) {
      const userRef = ref(db, `users/${id}`);
      remove(userRef);
    }
  };

  const handleDeleteRecord = (id: string) => {
    const recordRef = ref(db, `records/${id}`);
    remove(recordRef);
  };

  const handleUpdateRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    const recordRef = ref(db, `records/${id}`);
    update(recordRef, updates);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('attendance');
  };

  if (!isInitialized) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold">جاري الاتصال بقاعدة البيانات...</div>;

  if (!user) {
    return <Login users={users} onLogin={setUser} />;
  }

  const themeClasses = {
    light: 'bg-gray-50 text-gray-900',
    dark: 'bg-black text-white',
    glass: 'bg-gradient-to-br from-blue-600 to-indigo-900 text-white backdrop-blur-md',
    corporate: 'bg-slate-900 text-slate-100'
  }[theme];

  const cardClasses = theme === 'dark' 
    ? 'bg-zinc-950 border-zinc-800 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
    : theme === 'glass'
    ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl'
    : 'bg-white border-gray-100 text-gray-900 shadow-sm';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${themeClasses} ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 lg:mr-64 p-4 md:p-8 overflow-y-auto">
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-6 rounded-3xl ${cardClasses}`}>
          <Clock />
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

        <div className="max-w-6xl mx-auto space-y-6 pb-20">
          {currentPage === 'attendance' && (
            <AttendancePage 
              records={records} 
              onAddRecord={handleAddRecord} 
              currentUserName={user.username}
              cardClasses={cardClasses}
              theme={theme}
            />
          )}
          {currentPage === 'my-logs' && (
            <MyLogsPage
              records={records}
              currentUserName={user.username}
              onAddRecord={handleAddRecord}
              onDeleteRecord={handleDeleteRecord}
              onUpdateRecord={handleUpdateRecord}
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

        <footer className="max-w-6xl mx-auto py-8 border-t border-white/10 text-center opacity-50 text-sm">
          <p>مع تحيات المطور Amir Lamay</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
