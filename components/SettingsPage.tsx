
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
  const [newDepartment, setNewDepartment] = useState('');
  const [tempAppName, setTempAppName] = useState(appName);
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userLocations, setUserLocations] = useState<UserLocationConfig[]>([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [currentBranches, setCurrentBranches] = useState<BranchLocation[]>([]);
  
  const [showPermModal, setShowPermModal] = useState(false);
  const [permUserId, setPermUserId] = useState('');
  const [userPerms, setUserPerms] = useState<UserPermissions>({
    attendance: true,
    locationAttendance: true,
    myLogs: true,
    history: true,
    settings: false,
    vacationRequest: true,
    adminVacations: false,
    viewAllTodayRecords: false
  });

  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

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
      setUserPerms({
        ...targetUser.permissions,
        viewAllTodayRecords: targetUser.permissions.viewAllTodayRecords || false
      });
    } else {
      setUserPerms({
        attendance: true,
        locationAttendance: true,
        myLogs: true,
        history: true,
        settings: false,
        vacationRequest: true,
        adminVacations: false,
        viewAllTodayRecords: false
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
      onAddUser({ username: newUsername, password: newPassword, department: newDepartment, isAdmin: false });
      setNewUsername('');
      setNewPassword('');
      setNewDepartment('');
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditUserId(user.id);
    setEditUsername(user.username);
    setEditPassword(user.password);
    setEditDepartment(user.department || '');
    setShowEditUserModal(true);
  };

  const handleSaveUserEdit = () => {
    if (!editUsername || !editPassword) {
      alert('يرجى إدخال البيانات كاملة');
      return;
    }
    onUpdateUser(editUserId, { username: editUsername, password: editPassword, department: editDepartment });
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

  return (
    <div className="space-y-6 pb-10 text-right" dir="rtl">
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
        <h2 className="text-xl font-bold">إدارة صلاحيات الوصول</h2>
        <button 
          onClick={() => setShowPermModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <span>🔐</span> إدارة صلاحيات المستخدمين
        </button>
      </div>

      {/* Permissions Modal */}
      {showPermModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className={`${cardClasses} w-full max-w-2xl p-8 rounded-[40px] shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]`}>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                 <h3 className="text-2xl font-black">🔐 إعدادات الصلاحيات</h3>
                 <button onClick={() => setShowPermModal(false)} className="text-2xl opacity-50">✖</button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60">اختر المستخدم للتعديل</label>
                    <select 
                      className="w-full p-4 bg-black/5 dark:bg-white/10 rounded-2xl outline-none border border-white/5"
                      value={permUserId}
                      onChange={(e) => handleSelectUserPerm(e.target.value)}
                    >
                      <option value="">-- اختر مستخدم --</option>
                      {users.filter(u => !u.isAdmin).map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                 </div>

                 {permUserId && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                      {[
                        { key: 'attendance', label: 'تسجيل حضور وانصراف' },
                        { key: 'locationAttendance', label: 'حضور موقع (لوكيشن)' },
                        { key: 'myLogs', label: 'صفحة إجازاتي ومأمورياتي' },
                        { key: 'history', label: 'الأرشيف والسجل السابق' },
                        { key: 'vacationRequest', label: 'إرسال طلبات إجازة' },
                        { key: 'adminVacations', label: 'إدارة طلبات الإجازات (أدمن)' },
                        { key: 'viewAllTodayRecords', label: 'مشاهدة سجلات الجميع اليوم' },
                      ].map(perm => (
                        <button 
                          key={perm.key}
                          onClick={() => handleTogglePerm(perm.key as keyof UserPermissions)}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            userPerms[perm.key as keyof UserPermissions] 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-500' 
                            : 'bg-black/5 border-white/5 opacity-50'
                          }`}
                        >
                          <span className="font-bold text-sm">{perm.label}</span>
                          <span className="text-xl">{userPerms[perm.key as keyof UserPermissions] ? '✅' : '❌'}</span>
                        </button>
                      ))}
                   </div>
                 )}

                 <button 
                  disabled={!permUserId}
                  onClick={savePermissions}
                  className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-all mt-6 disabled:opacity-30"
                >
                  حفظ الصلاحيات المحدثة
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Existing Apperance, Add user sections ... */}
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
        <h2 className="text-xl font-bold mb-4">إضافة مستخدم جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl border border-white/5 outline-none" placeholder="اسم المستخدم" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          <input className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl border border-white/5 outline-none" type="password" placeholder="كلمة المرور" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl border border-white/5 outline-none" placeholder="القسم" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} />
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
                <th className="px-6 py-3">القسم</th>
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
                  <td className="px-6 py-4 opacity-50 font-bold">{u.department || 'عام'}</td>
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
              <div className="space-y-1">
                <label className="text-xs font-bold opacity-60 mr-2">القسم</label>
                <input 
                  className="w-full px-5 py-3 bg-black/5 dark:bg-white/10 border border-white/5 rounded-2xl outline-none"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
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
    </div>
  );
};

export default SettingsPage;
