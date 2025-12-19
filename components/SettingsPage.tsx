
import React, { useState, useEffect } from 'react';
import { User, Theme, BranchLocation, UserLocationConfig, UserPermissions } from '../types';
import { db, ref, onValue, set, update } from '../utils/firebase';
import { parseCoordinates, resolveShortLink } from '../utils/locationUtils';

interface SettingsPageProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  cardClasses: string;
  theme: string;
  appName: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  users, onAddUser, onUpdateUser, onDeleteUser, currentTheme, onThemeChange, cardClasses, theme, appName 
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tempAppName, setTempAppName] = useState(appName);
  
  // Location Management State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userLocations, setUserLocations] = useState<UserLocationConfig[]>([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [currentBranches, setCurrentBranches] = useState<BranchLocation[]>([]);
  
  // Permissions State
  const [showPermModal, setShowPermModal] = useState(false);
  const [permUserId, setPermUserId] = useState('');
  const [userPerms, setUserPerms] = useState<UserPermissions>({
    attendance: true,
    locationAttendance: true,
    myLogs: true,
    history: true,
    settings: false,
    vacationRequest: true,
    adminVacations: false
  });

  // Edit User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Branch Modal State
  const [tempBranchName, setTempBranchName] = useState('');
  const [tempBranchAddress, setTempBranchAddress] = useState('');
  const [tempBranchLocation, setTempBranchLocation] = useState('');
  const [isResolving, setIsResolving] = useState(false);

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

  const handleSelectUserPerm = (userId: string) => {
    setPermUserId(userId);
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && targetUser.permissions) {
      setUserPerms(targetUser.permissions);
    } else {
      setUserPerms({
        attendance: true,
        locationAttendance: true,
        myLogs: true,
        history: true,
        settings: false,
        vacationRequest: true,
        adminVacations: false
      });
    }
  };

  const handleTogglePerm = (key: keyof UserPermissions) => {
    setUserPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePermissions = () => {
    if (!permUserId) return;
    update(ref(db, `users/${permUserId}`), { permissions: userPerms })
      .then(() => {
        alert('تم تحديث الصلاحيات بنجاح');
        setShowPermModal(false);
      });
  };

  const handleAddUser = () => {
    if (newUsername && newPassword) {
      onAddUser({ username: newUsername, password: newPassword, isAdmin: false });
      setNewUsername('');
      setNewPassword('');
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditUserId(user.id);
    setEditUsername(user.username);
    setEditPassword(user.password);
    setShowEditUserModal(true);
  };

  const handleSaveUserEdit = () => {
    if (!editUsername || !editPassword) {
      alert('يرجى إدخال البيانات كاملة');
      return;
    }
    onUpdateUser(editUserId, { username: editUsername, password: editPassword });
    setShowEditUserModal(false);
    alert('تم تعديل بيانات المستخدم بنجاح');
  };

  const handleSaveAppName = () => {
    if (!tempAppName.trim()) {
      alert('اسم البرنامج لا يمكن أن يكون فارغاً');
      return;
    }
    set(ref(db, 'appConfig/name'), tempAppName.trim())
      .then(() => alert('تم تحديث اسم البرنامج بنجاح'));
  };

  const handleSelectUserForLocation = (userId: string) => {
    setSelectedUserId(userId);
    const config = userLocations.find(l => l.userId === userId);
    setCurrentBranches(config?.branches || []);
  };

  const saveBranch = async () => {
    if (!tempBranchName || !tempBranchLocation) {
      alert('يرجى إكمال البيانات');
      return;
    }
    let locationToParse = tempBranchLocation;
    if (tempBranchLocation.includes('maps.app.goo.gl') || tempBranchLocation.includes('goo.gl/maps')) {
      setIsResolving(true);
      const resolved = await resolveShortLink(tempBranchLocation);
      if (resolved) locationToParse = resolved;
      setIsResolving(false);
    }
    const coords = parseCoordinates(locationToParse);
    if (!coords) {
      alert('تعذر استخراج الإحداثيات');
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
    setTempBranchName(''); setTempBranchAddress(''); setTempBranchLocation('');
    setShowBranchModal(false);
  };

  const saveAllUserLocations = () => {
    if (!selectedUserId) return;
    set(ref(db, `userLocations/${selectedUserId}`), { branches: currentBranches })
      .then(() => alert('تم حفظ المواقع بنجاح'));
  };

  return (
    <div className="space-y-6 pb-10">
      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <h2 className="text-xl font-bold mb-4">⚙️ إعدادات عامة للنظام</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold opacity-60 mr-2">اسم البرنامج المعروض</label>
            <input 
              className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl outline-none" 
              placeholder="مثلاً: نظام حضور شركة كذا" 
              value={tempAppName} 
              onChange={(e) => setTempAppName(e.target.value)} 
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleSaveAppName} 
              className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
            >
              حفظ الاسم
            </button>
          </div>
        </div>
      </div>

      <div className={`${cardClasses} p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4`}>
        <h2 className="text-xl font-bold">صلاحيات الحسابات</h2>
        <button 
          onClick={() => setShowPermModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
        >
          ⚙️ إدارة صلاحيات المستخدمين
        </button>
      </div>

      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <h2 className="text-xl font-bold mb-4">اعدادات المظهر</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['light', 'dark', 'glass', 'corporate', 'midnight', 'emerald', 'rose'].map(t => (
            <button
              key={t}
              onClick={() => onThemeChange(t as Theme)}
              className={`p-4 rounded-xl text-center font-bold border ${currentTheme === t ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-102 opacity-60'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <h2 className="text-xl font-bold mb-4">إعدادات المواقع الجغرافية (لوكيشن)</h2>
        <div className="space-y-4">
          <select 
            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl outline-none"
            value={selectedUserId}
            onChange={(e) => handleSelectUserForLocation(e.target.value)}
          >
            <option value="">-- اختر موظف لضبط فروعه --</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
          {selectedUserId && (
            <div className="space-y-4">
               <button onClick={() => setShowBranchModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm">➕ إضافة فرع</button>
               <div className="space-y-2">
                 {currentBranches.map((b, i) => (
                   <div key={b.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl text-sm">
                     <span>{b.name}</span>
                     <button onClick={() => setCurrentBranches(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500">🗑️</button>
                   </div>
                 ))}
               </div>
               <button onClick={saveAllUserLocations} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">حفظ الفروع</button>
            </div>
          )}
        </div>
      </div>

      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <h2 className="text-xl font-bold mb-4">إضافة مستخدم جديد</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input className="flex-1 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl border border-white/5 outline-none" placeholder="اسم المستخدم" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          <input className="flex-1 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl border border-white/5 outline-none" type="password" placeholder="كلمة المرور" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button onClick={handleAddUser} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg active:scale-95 transition-all">إضافة</button>
        </div>
      </div>

      <div className={`${cardClasses} rounded-3xl overflow-hidden`}>
        <div className="p-4 border-b border-white/10 font-bold">قائمة الحسابات المسجلة</div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-3">المستخدم</th>
                <th className="px-6 py-3">كلمة المرور</th>
                <th className="px-6 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-500/20 text-blue-500 flex items-center justify-center rounded-full text-xs">👤</span>
                      {u.username} 
                      {u.isAdmin && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded ml-1">ADMIN</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 opacity-50 font-mono">****</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button 
                      onClick={() => handleOpenEditModal(u)}
                      className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                    >
                      <span>✏️</span> تعديل
                    </button>
                    {!u.isAdmin && (
                      <button 
                        onClick={() => onDeleteUser(u.id)}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                      >
                        <span>🗑️</span> حذف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showEditUserModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`${cardClasses} w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6`}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">✏️ تعديل بيانات الحساب</h3>
              <button onClick={() => setShowEditUserModal(false)} className="text-2xl opacity-50">✖</button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold opacity-60 mr-2">اسم المستخدم الجديد</label>
                <input 
                  className="w-full px-5 py-3 bg-black/5 dark:bg-white/10 border border-white/5 rounded-2xl outline-none"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold opacity-60 mr-2">كلمة المرور الجديدة</label>
                <input 
                  type="text"
                  className="w-full px-5 py-3 bg-black/5 dark:bg-white/10 border border-white/5 rounded-2xl outline-none"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>
              <button 
                onClick={handleSaveUserEdit}
                className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-all mt-4"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`${cardClasses} w-full max-w-lg p-8 rounded-[40px] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">⚙️ صلاحيات الحسابات</h3>
              <button onClick={() => setShowPermModal(false)} className="text-2xl opacity-50">✖</button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold opacity-60">اختر الحساب المراد تعديله</label>
              <select 
                className="w-full px-5 py-3 bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl outline-none"
                value={permUserId}
                onChange={(e) => handleSelectUserPerm(e.target.value)}
              >
                <option value="">-- اختر المستخدم --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>

            {permUserId && (
              <div className="space-y-3">
                <p className="font-bold text-center border-b border-white/10 pb-2">تفعيل القوائم لهذا الحساب:</p>
                {[
                  { key: 'attendance', label: 'حضور وانصراف', icon: '📝' },
                  { key: 'locationAttendance', label: 'حضور لوكيشن', icon: '📍' },
                  { key: 'myLogs', label: 'إجازاتي ومأمورياتي', icon: '🏖️' },
                  { key: 'history', label: 'الحضور السابق', icon: '📅' },
                  { key: 'vacationRequest', label: 'طلب إجازة', icon: '📩' },
                  { key: 'adminVacations', label: 'طلبات الإجازة المرسلة (إدارة)', icon: '📋' },
                  { key: 'settings', label: 'الإعدادات', icon: '⚙️' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-bold text-sm">{item.label}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleTogglePerm(item.key as keyof UserPermissions)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${userPerms[item.key as keyof UserPermissions] ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-gray-200 text-gray-400 opacity-30 hover:opacity-60'}`}
                      >تفعيل</button>
                      <button 
                         onClick={() => handleTogglePerm(item.key as keyof UserPermissions)}
                         className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!userPerms[item.key as keyof UserPermissions] ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-gray-200 text-gray-400 opacity-30 hover:opacity-60'}`}
                      >عدم تفعيل</button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={savePermissions}
                  className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-all mt-4"
                >حفظ الصلاحيات</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showBranchModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className={`${cardClasses} w-full max-w-md p-8 rounded-[40px] space-y-4`}>
             <h3 className="text-xl font-black">إضافة فرع</h3>
             <input className="w-full p-3 bg-black/5 rounded-2xl" placeholder="اسم الفرع" value={tempBranchName} onChange={(e) => setTempBranchName(e.target.value)} />
             <input className="w-full p-3 bg-black/5 rounded-2xl" placeholder="رابط جوجل ماب" value={tempBranchLocation} onChange={(e) => setTempBranchLocation(e.target.value)} />
             <div className="flex gap-2">
                <button onClick={saveBranch} className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold">إضافة</button>
                <button onClick={() => setShowBranchModal(false)} className="flex-1 bg-gray-500 text-white py-3 rounded-2xl font-bold">إلغاء</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
