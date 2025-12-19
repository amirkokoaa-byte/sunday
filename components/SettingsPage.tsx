
import React, { useState, useEffect } from 'react';
import { User, Theme, BranchLocation, UserLocationConfig } from '../types';
import { db, ref, onValue, set } from '../utils/firebase';
import { parseCoordinates } from '../utils/locationUtils';

interface SettingsPageProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  cardClasses: string;
  theme: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  users, onAddUser, onUpdateUser, onDeleteUser, currentTheme, onThemeChange, cardClasses, theme 
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Location Management State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userLocations, setUserLocations] = useState<UserLocationConfig[]>([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [currentBranches, setCurrentBranches] = useState<BranchLocation[]>([]);
  
  // Branch Modal State
  const [tempBranchName, setTempBranchName] = useState('');
  const [tempBranchAddress, setTempBranchAddress] = useState('');
  const [tempBranchLocation, setTempBranchLocation] = useState('');

  useEffect(() => {
    const locRef = ref(db, 'userLocations');
    const unsubscribe = onValue(locRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: UserLocationConfig[] = Object.keys(data).map(key => ({
          userId: key,
          branches: data[key].branches || []
        }));
        setUserLocations(list);
      } else {
        setUserLocations([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = () => {
    if (newUsername && newPassword) {
      onAddUser({ username: newUsername, password: newPassword });
      setNewUsername('');
      setNewPassword('');
    }
  };

  const handleSelectUserForLocation = (userId: string) => {
    setSelectedUserId(userId);
    const config = userLocations.find(l => l.userId === userId);
    setCurrentBranches(config?.branches || []);
  };

  const handleAddBranchField = () => {
    if (currentBranches.length < 10) {
      setShowBranchModal(true);
    } else {
      alert('الحد الأقصى هو 10 فروع لكل موظف');
    }
  };

  const saveBranch = () => {
    const coords = parseCoordinates(tempBranchLocation);
    if (!tempBranchName || !coords) {
      alert('يرجى التأكد من اسم الفرع وإحداثيات الموقع (مثال: 30.123, 31.456 أو رابط خرائط جوجل)');
      return;
    }

    const newBranch: BranchLocation = {
      id: Math.random().toString(36).substr(2, 9),
      name: tempBranchName,
      address: tempBranchAddress,
      latitude: coords.lat,
      longitude: coords.lng
    };

    const updated = [...currentBranches, newBranch];
    setCurrentBranches(updated);
    setTempBranchName('');
    setTempBranchAddress('');
    setTempBranchLocation('');
    setShowBranchModal(false);
  };

  const saveAllUserLocations = () => {
    if (!selectedUserId) return;
    const locRef = ref(db, `userLocations/${selectedUserId}`);
    set(locRef, { branches: currentBranches })
      .then(() => alert('تم حفظ مواقع الموظف بنجاح'))
      .catch(() => alert('خطأ في الحفظ'));
  };

  const themes: { id: Theme; label: string; class: string }[] = [
    { id: 'light', label: 'فاتح', class: 'bg-white text-gray-900 border' },
    { id: 'dark', label: 'داكن (أسود)', class: 'bg-zinc-950 text-white border border-zinc-800' },
    { id: 'glass', label: 'زجاجي', class: 'bg-blue-500/30 text-white backdrop-blur border border-white/20' },
    { id: 'corporate', label: 'احترافي', class: 'bg-slate-800 text-white border border-slate-700' },
    { id: 'midnight', label: 'ليلي', class: 'bg-slate-900 text-slate-100 border border-slate-800 shadow-xl' },
    { id: 'emerald', label: 'زمردي', class: 'bg-emerald-50 text-emerald-900 border border-emerald-100 shadow-md' },
    { id: 'rose', label: 'زهري', class: 'bg-rose-50 text-rose-900 border border-rose-100 shadow-md' }
  ];

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <h2 className="text-xl font-bold mb-4">اعدادات المظهر</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`p-4 rounded-xl text-center font-bold transition-all ${t.class} ${currentTheme === t.id ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-102'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <h2 className="text-xl font-bold mb-4">إعدادات المواقع الجغرافية (لوكيشن)</h2>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm mb-1 opacity-60">اختر الموظف</label>
              <select 
                className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl outline-none"
                value={selectedUserId}
                onChange={(e) => handleSelectUserForLocation(e.target.value)}
              >
                <option value="">-- اختر موظف --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
            {selectedUserId && (
              <button 
                onClick={handleAddBranchField}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"
              >
                <span>➕</span> إضافة لوكيشن فرع
              </button>
            )}
          </div>

          {selectedUserId && (
            <div className="border border-white/10 rounded-2xl p-4 mt-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span>📍</span> الفروع المسجلة لـ {users.find(u => u.id === selectedUserId)?.username}
              </h3>
              <div className="space-y-2">
                {currentBranches.length === 0 ? (
                  <p className="opacity-40 text-sm italic">لم يتم إضافة فروع بعد</p>
                ) : (
                  currentBranches.map((b, idx) => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <div className="font-bold">{b.name}</div>
                        <div className="text-xs opacity-60">{b.address} | {b.latitude}, {b.longitude}</div>
                      </div>
                      <button 
                        onClick={() => setCurrentBranches(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg"
                      >🗑️</button>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={saveAllUserLocations}
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg"
              >حفظ جميع المواقع</button>
            </div>
          )}
        </div>
      </div>

      {showBranchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${cardClasses} w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4`}>
            <h3 className="text-xl font-bold">إضافة فرع جديد</h3>
            <div>
              <label className="block text-sm mb-1 opacity-60">اسم الفرع</label>
              <input 
                className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl outline-none"
                placeholder="مثال: فرع القاهرة"
                value={tempBranchName}
                onChange={(e) => setTempBranchName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 opacity-60">عنوان الفرع (اختياري)</label>
              <input 
                className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl outline-none"
                placeholder="العنوان التفصيلي"
                value={tempBranchAddress}
                onChange={(e) => setTempBranchAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 opacity-60">لوكيشن جوجل ماب أو إحداثيات</label>
              <input 
                className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl outline-none"
                placeholder="مثال: 30.123, 31.456"
                value={tempBranchLocation}
                onChange={(e) => setTempBranchLocation(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={saveBranch} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">إضافة</button>
              <button onClick={() => setShowBranchModal(false)} className="flex-1 bg-gray-200 dark:bg-zinc-800 py-3 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <h2 className="text-xl font-bold mb-4">إضافة مستخدم جديد</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            className="flex-1 px-4 py-2 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="اسم المستخدم"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            className="flex-1 px-4 py-2 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="كلمة المرور"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={handleAddUser}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            إضافة مستخدم
          </button>
        </div>
      </div>

      <div className={`${cardClasses} rounded-3xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 font-bold">المستخدم</th>
                <th className="px-6 py-3 font-bold">كلمة المرور</th>
                <th className="px-6 py-3 font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-500/20 text-blue-500 flex items-center justify-center rounded-full text-xs">👤</span>
                      {u.username} 
                      {u.isAdmin && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">ADMIN</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 opacity-50 font-mono">****</td>
                  <td className="px-6 py-4 space-x-2 space-x-reverse">
                    <button 
                      onClick={() => {
                        const pass = prompt('ادخل كلمة المرور الجديدة:');
                        if(pass) onUpdateUser(u.id, { password: pass });
                      }}
                      className="text-blue-500 hover:bg-blue-500/10 px-3 py-1 rounded-lg font-bold text-sm transition-all"
                    >تغيير الباسورد</button>
                    {!u.isAdmin && (
                      <button 
                        onClick={() => onDeleteUser(u.id)}
                        className="text-red-500 hover:bg-red-500/10 px-3 py-1 rounded-lg font-bold text-sm transition-all"
                      >حذف</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
