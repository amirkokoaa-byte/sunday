
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, RecordType } from '../types';
import { formatDate, getDayName } from '../utils/dateUtils';

interface MyLogsPageProps {
  records: AttendanceRecord[];
  currentUserName: string;
  onAddRecord: (type: RecordType, date?: Date) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  cardClasses: string;
  theme: string;
}

const MyLogsPage: React.FC<MyLogsPageProps> = ({ 
  records, currentUserName, onAddRecord, onDeleteRecord, onUpdateRecord, cardClasses, theme 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // يعرض فقط سجلات المستخدم الحالي التي تم تعليمها كخاصة (isPrivate = true)
  const myRecords = useMemo(() => {
    return records
      .filter(r => 
        r.userName === currentUserName && 
        r.isPrivate === true && // تصفية السجلات الخاصة فقط
        formatDate(new Date(r.date)).includes(searchTerm)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, currentUserName, searchTerm]);

  const tableHeaderClasses = theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-gray-50 text-gray-500';

  const handleManualAdd = (type: RecordType) => {
    const dateInput = prompt('ادخل التاريخ (يوم/شهر/سنة) أو اتركه فارغاً لليوم الحالي:');
    if (dateInput === null) return;
    
    let targetDate = new Date();
    if (dateInput.trim() !== '') {
      const parts = dateInput.split('/');
      if (parts.length === 3) {
        targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        alert('تنسيق التاريخ غير صحيح، يرجى استخدام (يوم/شهر/سنة)');
        return;
      }
    }
    onAddRecord(type, targetDate);
  };

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">إجازاتي ومأمورياتي الخاصة</h2>
            <p className="opacity-60">السجلات المضافة هنا تظهر لك وحدك ولا تظهر في السجل العام</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleManualAdd(RecordType.VACATION)}
              className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg active:scale-95"
            >
              🏖️ إضافة إجازة خاصة
            </button>
            <button
              onClick={() => handleManualAdd(RecordType.MISSION)}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg active:scale-95"
            >
              🚗 إضافة مأمورية خاصة
            </button>
          </div>
        </div>
        
        <div className="mt-6 relative">
          <input
            type="text"
            placeholder="البحث في إجازاتي الخاصة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        </div>
      </div>

      <div className={`${cardClasses} rounded-3xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className={`${tableHeaderClasses} text-sm`}>
              <tr>
                <th className="px-6 py-4 font-semibold">اليوم</th>
                <th className="px-6 py-4 font-semibold">التاريخ</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center opacity-40 italic">
                    لا توجد إجازات خاصة مسجلة (السجلات المضافة من صفحة الحضور تظهر في السجل العام فقط)
                  </td>
                </tr>
              ) : (
                myRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 opacity-70">{record.dayName}</td>
                    <td className="px-6 py-4 opacity-70">{formatDate(new Date(record.date))}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.type === RecordType.MISSION
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2 justify-end">
                      <button 
                        onClick={() => {
                          const newType = record.type === RecordType.VACATION ? RecordType.MISSION : RecordType.VACATION;
                          if(confirm(`تغيير النوع إلى ${newType}؟`)) onUpdateRecord(record.id, { type: newType });
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="تعديل"
                      >✏️</button>
                      <button 
                        onClick={() => {
                          if(confirm('هل انت متأكد من الحذف؟')) onDeleteRecord(record.id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="حذف"
                      >🗑️</button>
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

export default MyLogsPage;
