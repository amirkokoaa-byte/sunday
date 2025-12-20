
import React, { useMemo } from 'react';
import { AttendanceRecord, RecordType, User } from '../types';
import { formatDate, getPeriodLabel, isToday } from '../utils/dateUtils';

interface AttendancePageProps {
  records: AttendanceRecord[];
  onAddRecord: (type: RecordType) => void;
  onUpdateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  onDeleteRecord: (id: string) => void;
  user: User;
  users: User[];
  cardClasses: string;
  theme: string;
}

const AttendancePage: React.FC<AttendancePageProps> = ({ 
  records, onAddRecord, onUpdateRecord, onDeleteRecord, user, users, cardClasses, theme 
}) => {
  const today = new Date();
  const todayStr = formatDate(today);
  
  // Get today's records
  const todayRecordsAll = records.filter(r => isToday(r.date));
  
  // User status today
  const hasSignedToday = todayRecordsAll.some(r => r.userName === user.username && r.type === RecordType.ATTENDANCE);
  const hasVacationToday = todayRecordsAll.some(r => r.userName === user.username && r.type === RecordType.VACATION);
  const hasMissionToday = todayRecordsAll.some(r => r.userName === user.username && r.type === RecordType.MISSION);

  const isActionDisabled = !user.isAdmin && (hasSignedToday || hasVacationToday || hasMissionToday);
  
  // التحقق من صلاحية رؤية سجلات الجميع
  const canViewAll = user.isAdmin || (user.permissions?.viewAllTodayRecords === true);

  // التعديل الرئيسي: تصفية السجلات بناءً على الصلاحية
  const displayRecords = canViewAll 
    ? todayRecordsAll 
    : todayRecordsAll.filter(r => r.userName === user.username);

  // التحقق من صلاحية تسجيل الحضور (لإظهار أو إخفاء صندوق الأزرار)
  const canPerformAttendance = user.isAdmin || (user.permissions ? user.permissions.attendance : true);

  // Quick Stats
  const presentCount = todayRecordsAll.filter(r => r.type === RecordType.ATTENDANCE || r.type === RecordType.LOC_ATTENDANCE).length;
  const vacationCount = todayRecordsAll.filter(r => r.type === RecordType.VACATION).length;
  const missionCount = todayRecordsAll.filter(r => r.type === RecordType.MISSION).length;

  // Group by Department (For Admin only)
  const attendanceByDept = useMemo(() => {
    const groups: { [dept: string]: { present: string[], count: number } } = {};
    
    todayRecordsAll.forEach(record => {
      if (record.type === RecordType.ATTENDANCE || record.type === RecordType.LOC_ATTENDANCE) {
        let dept = record.department || 'عام';
        if (!record.department) {
           const u = users.find(usr => usr.username === record.userName);
           if (u?.department) dept = u.department;
        }

        if (!groups[dept]) groups[dept] = { present: [], count: 0 };
        groups[dept].present.push(record.userName);
        groups[dept].count += 1;
      }
    });
    return groups;
  }, [todayRecordsAll, users]);

  const handleEdit = (record: AttendanceRecord) => {
    const types = Object.values(RecordType);
    const newType = prompt(`تغيير الحالة إلى (حضور، إجازة سنوية، مأمورية):`, record.type);
    if (newType && types.includes(newType as RecordType)) {
      onUpdateRecord(record.id, { type: newType as RecordType });
    } else if (newType) {
      alert('النوع غير صحيح');
    }
  };

  const tableHeaderClasses = theme === 'dark' || theme === 'midnight' || theme === 'corporate' 
    ? 'bg-zinc-900/50 text-zinc-400' 
    : 'bg-gray-50 text-gray-500';

  return (
    <div className="space-y-6">
      {/* Quick Summary Dashboard - Only visible to those who can view all stats */}
      {canViewAll && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`${cardClasses} p-6 rounded-3xl flex items-center justify-between border border-white/5`}>
            <div>
              <p className="text-xs font-bold opacity-60">الحضور اليوم</p>
              <p className="text-2xl font-black mt-1">{presentCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 text-green-500 flex items-center justify-center rounded-2xl text-2xl">✅</div>
          </div>
          <div className={`${cardClasses} p-6 rounded-3xl flex items-center justify-between border border-white/5`}>
            <div>
              <p className="text-xs font-bold opacity-60">الإجازات</p>
              <p className="text-2xl font-black mt-1">{vacationCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 flex items-center justify-center rounded-2xl text-2xl">🏖️</div>
          </div>
          <div className={`${cardClasses} p-6 rounded-3xl flex items-center justify-between border border-white/5`}>
            <div>
              <p className="text-xs font-bold opacity-60">المأموريات</p>
              <p className="text-2xl font-black mt-1">{missionCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 flex items-center justify-center rounded-2xl text-2xl">🚗</div>
          </div>
        </div>
      )}

      {/* Admin Department Grouping View */}
      {user.isAdmin && Object.keys(attendanceByDept).length > 0 && (
        <div className={`${cardClasses} p-6 rounded-3xl border border-white/5 space-y-4`}>
          <div className="flex items-center gap-2 mb-2">
             <span className="text-xl">📊</span>
             <h3 className="text-lg font-black">الحضور حسب القسم</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
             {(Object.entries(attendanceByDept) as [string, { present: string[], count: number }][]).map(([dept, data]) => (
               <div key={dept} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-sm text-blue-500">{dept}</span>
                    <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{data.count} حاضر</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {data.present.map(name => (
                      <span key={name} className="text-[10px] opacity-70 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{name}</span>
                    ))}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* تسجيل الحضور */}
      {canPerformAttendance && (
        <div className={`${cardClasses} p-6 rounded-3xl border border-white/5`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">إمضاء حضور وانصراف</h2>
              <p className="opacity-60 mt-1 font-bold">{getPeriodLabel(today)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => onAddRecord(RecordType.VACATION)} 
                disabled={isActionDisabled} 
                className={`px-4 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-2 ${isActionDisabled ? 'opacity-30 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-sm'}`}
              >
                <span>🏖️</span>
                إجازة سنوية
              </button>
              <button 
                onClick={() => onAddRecord(RecordType.MISSION)} 
                disabled={isActionDisabled} 
                className={`px-4 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-2 ${isActionDisabled ? 'opacity-30 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-sm'}`}
              >
                <span>🚗</span>
                مأمورية
              </button>
              <button 
                onClick={() => onAddRecord(RecordType.ATTENDANCE)} 
                disabled={isActionDisabled} 
                className={`px-6 py-3 rounded-2xl font-black transition-all active:scale-95 flex items-center gap-2 shadow-xl ${isActionDisabled ? 'opacity-30 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                <span>✅</span>
                إمضاء حضور
              </button>
            </div>
          </div>
          {isActionDisabled && !user.isAdmin && (
            <p className="text-[10px] text-orange-500 font-bold mt-4 bg-orange-500/10 p-2 rounded-lg inline-block">
              ⚠️ لقد قمت بتسجيل حالتك لليوم بالفعل.
            </p>
          )}
        </div>
      )}

      {/* جدول السجلات */}
      <div className={`${cardClasses} rounded-3xl overflow-hidden border border-white/5 shadow-2xl`}>
        <div className="p-5 border-b border-white/10 font-black flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>{canViewAll ? 'سجلات اليوم لجميع العاملين' : 'سجلي اليوم'} ({todayStr})</span>
          </div>
          {user.isAdmin && <span className="text-[10px] bg-blue-500 text-white px-3 py-1 rounded-full font-black uppercase tracking-wider">لوحة الإدارة</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className={`${tableHeaderClasses} text-[11px] font-black uppercase`}>
              <tr>
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4">القسم</th>
                <th className="px-6 py-4">الوقت</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="opacity-30 flex flex-col items-center gap-3">
                      <span className="text-5xl">📭</span>
                      <span className="font-bold">لا توجد سجلات لعرضها</span>
                    </div>
                  </td>
                </tr>
              ) : (
                displayRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-all duration-200">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs uppercase">
                          {record.userName.charAt(0)}
                        </div>
                        <span className="font-bold text-sm">{record.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="text-[10px] font-bold opacity-60">{record.department || 'عام'}</span>
                    </td>
                    <td className="px-6 py-5 text-xs font-mono opacity-70">
                      {new Date(record.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm ${
                        record.type === RecordType.ATTENDANCE || record.type === RecordType.LOC_ATTENDANCE 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : record.type === RecordType.VACATION ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                        : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-1">
                        {(user.isAdmin || record.userName === user.username) && (
                          <>
                            <button 
                              onClick={() => handleEdit(record)} 
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                              title="تعديل"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => onDeleteRecord(record.id)} 
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              title="حذف"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
