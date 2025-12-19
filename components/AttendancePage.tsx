
import React from 'react';
import { AttendanceRecord, RecordType } from '../types';
import { formatDate, getPeriodLabel, isToday } from '../utils/dateUtils';

interface AttendancePageProps {
  records: AttendanceRecord[];
  onAddRecord: (type: RecordType) => void;
  currentUserName: string;
  cardClasses: string;
  theme: string;
}

const AttendancePage: React.FC<AttendancePageProps> = ({ records, onAddRecord, currentUserName, cardClasses, theme }) => {
  // نحصل على كافة سجلات اليوم للتحقق من حالة المستخدم الحالي
  const todayRecordsAll = records.filter(r => isToday(r.date));
  
  // التحقق من حالة المستخدم اليوم (بصرف النظر عن كون السجل خاصاً أم عاماً لمنع التكرار)
  const hasSignedToday = todayRecordsAll.some(r => r.userName === currentUserName && r.type === RecordType.ATTENDANCE);
  const hasVacationToday = todayRecordsAll.some(r => r.userName === currentUserName && r.type === RecordType.VACATION);
  const hasMissionToday = todayRecordsAll.some(r => r.userName === currentUserName && r.type === RecordType.MISSION);

  const isActionDisabled = hasSignedToday || hasVacationToday || hasMissionToday;

  // الجدول العام يعرض فقط السجلات التي ليست خاصة (isPrivate = false)
  const todayPublicRecords = todayRecordsAll.filter(r => r.isPrivate === false || r.isPrivate === undefined);

  const periodLabel = getPeriodLabel(new Date());
  const tableHeaderClasses = theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-gray-50 text-gray-500';

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">إمضاء حضور وانصراف</h2>
            <p className="opacity-60 mt-1">{periodLabel}</p>
            {hasVacationToday && <p className="text-orange-500 text-sm font-bold mt-1">⚠️ أنت مسجل في إجازة اليوم</p>}
            {hasMissionToday && <p className="text-purple-500 text-sm font-bold mt-1">⚠️ أنت مسجل في مأمورية اليوم</p>}
          </div>
          <div className="flex flex-wrap gap-2">
             <button
              onClick={() => onAddRecord(RecordType.VACATION)}
              disabled={isActionDisabled}
              className={`px-4 md:px-6 py-2.5 rounded-xl font-bold transition-all ${
                isActionDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
              }`}
            >
              🏖️ إجازة سنوية
            </button>
            <button
              onClick={() => onAddRecord(RecordType.MISSION)}
              disabled={isActionDisabled}
              className={`px-4 md:px-6 py-2.5 rounded-xl font-bold transition-all ${
                isActionDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
              }`}
            >
              🚗 مأمورية
            </button>
            <button
              onClick={() => onAddRecord(RecordType.ATTENDANCE)}
              disabled={isActionDisabled}
              className={`px-4 md:px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
                isActionDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }`}
            >
              ✅ إمضاء حضور
            </button>
          </div>
        </div>
      </div>

      <div className={`${cardClasses} rounded-3xl overflow-hidden`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold">سجل الحضور والإجازات العام لليوم ({formatDate(new Date())})</h3>
          <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold dark:bg-blue-900/30 dark:text-blue-400">مباشر</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className={`${tableHeaderClasses} text-sm`}>
              <tr>
                <th className="px-6 py-4 font-semibold">اسم الموظف</th>
                <th className="px-6 py-4 font-semibold">اليوم</th>
                <th className="px-6 py-4 font-semibold">التاريخ</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {todayPublicRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center opacity-40 italic">
                    لا توجد سجلات عامة مسجلة اليوم
                  </td>
                </tr>
              ) : (
                todayPublicRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{record.userName}</td>
                    <td className="px-6 py-4 opacity-70">{record.dayName}</td>
                    <td className="px-6 py-4 opacity-70">{formatDate(new Date(record.date))}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.type === RecordType.ATTENDANCE ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        record.type === RecordType.VACATION ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {record.type}
                      </span>
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
