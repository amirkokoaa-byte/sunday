
import React, { useState } from 'react';
import { User, Theme } from '../types';

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

  const handleAdd = () => {
    if (newUsername && newPassword) {
      onAddUser({ username: newUsername, password: newPassword });
      setNewUsername('');
      setNewPassword('');
    }
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
            onClick={handleAdd}
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
