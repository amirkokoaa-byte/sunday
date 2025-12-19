
import React from 'react';
import { AttendanceRecord, RecordType, User } from '../types';
import { formatDate, getPeriodLabel, isToday } from '../utils/dateUtils';

interface AttendancePageProps {
  records: AttendanceRecord[];
  onAddRecord: (type: RecordType) => void;
  onUpdateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  onDeleteRecord: (id: string) => void;
  user: User;
  cardClasses: string;
  theme: string;
}

const AttendancePage: React.FC<AttendancePageProps> = ({ 
  records, onAddRecord, onUpdateRecord, onDeleteRecord, user, cardClasses, theme 
}) => {
  const today = new Date();
  const todayStr = formatDate(today);
  
  // تصفية سجلات اليوم فقط
  const todayRecordsAll = records.filter(r => isToday(r.date));
  
  // للمستخدم العادي: هل سجل اليوم؟
  const hasSignedToday = todayRecordsAll.some(r => r.userName === user.username && r.type === RecordType.ATTENDANCE);
  const hasVacationToday = todayRecordsAll.some(r => r.userName === user.username && r.type === RecordType.VACATION);
  const hasMissionToday = todayRecordsAll.some(r => r.userName === user.username && r.type === RecordType.MISSION);

  const isActionDisabled = !user.isAdmin && (hasSignedToday || hasVacationToday || hasMissionToday);
  
  // السجلات التي تظهر في الجدول (للموظف سجلاته، للآدمن الكل)
  const displayRecords = user.isAdmin 
    ? todayRecordsAll 
    : todayRecordsAll.filter(r => r.userName === user.username);

  const handleEdit = (record: AttendanceRecord) => {
    const types = Object.values(RecordType);
    const newType = prompt(`تغيير الحالة إلى (حضور، إجازة سنوية، مأمورية):`, record.type);
    if (newType && types.includes(newType as RecordType)) {
      onUpdateRecord(record.id, { type: newType as RecordType });
    } else if (newType) {
      alert('النوع غير صحيح');
    }
  };

  const tableHeaderClasses = theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-gray-50 text-gray-500';

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">إمضاء حضور وانصراف</h2>
            <p className="opacity-60 mt-1">{getPeriodLabel(today)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onAddRecord(RecordType.VACATION)} disabled={isActionDisabled} className={`px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${isActionDisabled ? 'opacity-30' : 'bg-orange-100 text-orange-700'}`}>🏖️ إجازة سنوية</button>
            <button onClick={() => onAddRecord(RecordType.MISSION)} disabled={isActionDisabled} className={`px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${isActionDisabled ? 'opacity-30' : 'bg-purple-100 text-purple-700'}`}>🚗 مأمورية</button>
            <button onClick={() => onAddRecord(RecordType.ATTENDANCE)} disabled={isActionDisabled} className={`px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${isActionDisabled ? 'opacity-30' : 'bg-blue-600 text-white shadow-lg'}`}>✅ إمضاء حضور</button>
          </div>
        </div>
      </div>

      <div className={`${cardClasses} rounded-3xl overflow-hidden`}>
        <div className="p-4 border-b border-white/10 font-bold flex justify-between items-center">
          <span>سجلات اليوم ({todayStr})</span>
          {user.isAdmin && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">عرض الإدارة</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className={`${tableHeaderClasses} text-sm`}>
              <tr>
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4">الوقت</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الفرع/الموقع</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayRecords.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center opacity-40">لا توجد سجلات لليوم بعد</td></tr>
              ) : (
                displayRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{record.userName}</td>
                    <td className="px-6 py-4 text-xs font-mono opacity-70">
                      {new Date(record.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        record.type === RecordType.ATTENDANCE || record.type === RecordType.LOC_ATTENDANCE 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px]">
                       {record.branchName ? (
                         <div className="flex flex-col">
                           <span className="font-bold">{record.branchName}</span>
                           {record.locationLink && <a href={record.locationLink} target="_blank" className="text-blue-500 underline">خريطة 📍</a>}
                         </div>
                       ) : <span className="opacity-30">--</span>}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {(user.isAdmin || record.userName === user.username) && (
                        <>
                          <button onClick={() => handleEdit(record)} className="text-blue-500 hover:bg-blue-500/10 p-2 rounded">✏️</button>
                          <button onClick={() => onDeleteRecord(record.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded">🗑️</button>
                        </>
                      )}
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
