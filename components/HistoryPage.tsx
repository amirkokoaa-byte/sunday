
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, RecordType, User } from '../types';
import { formatDate, getPeriodLabel, isToday } from '../utils/dateUtils';
import { exportToCSV } from '../utils/excelUtils';

interface HistoryPageProps {
  records: AttendanceRecord[];
  user: User;
  onAddManualRecord: (type: RecordType, date: Date, name: string) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  cardClasses: string;
  theme: string;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ 
  records, user, onAddManualRecord, onDeleteRecord, onUpdateRecord, cardClasses, theme 
}) => {
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [appliedSearch, setAppliedSearch] = useState({ name: '', date: '' });

  // السجلات التي مر عليها أكثر من 24 ساعة (أو ببساطة ليست اليوم)
  const historyOnly = useMemo(() => {
    return records.filter(r => !isToday(r.date) && (r.isPrivate === false || r.isPrivate === undefined));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return historyOnly
      .filter(record => {
        const matchesName = !appliedSearch.name || record.userName.toLowerCase().includes(appliedSearch.name.toLowerCase());
        const matchesDate = !appliedSearch.date || formatDate(new Date(record.date)).includes(appliedSearch.date);
        return matchesName && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyOnly, appliedSearch]);

  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: AttendanceRecord[] } = {};
    filteredRecords.forEach(record => {
      // التجميع حسب اليوم والتاريخ ليكون منفصلاً
      const d = new Date(record.date);
      const dayKey = `${d.toLocaleDateString('ar-EG', { weekday: 'long' })} - ${formatDate(d)}`;
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(record);
    });
    return groups;
  }, [filteredRecords]);

  const handleSearchClick = () => {
    setAppliedSearch({ name: searchName, date: searchDate });
  };

  const handleAdminAdd = (type: RecordType) => {
    const name = prompt('ادخل اسم الموظف:');
    if (!name) return;
    const dateStr = prompt('ادخل التاريخ (يوم/شهر/سنة):', formatDate(new Date()));
    if (!dateStr) return;
    
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      onAddManualRecord(type, targetDate, name);
    } else {
      alert('تنسيق تاريخ خاطئ');
    }
  };

  const tableHeaderClasses = theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-white border-b border-gray-50 text-gray-400';

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-6 rounded-3xl space-y-6`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">السجل السابق (الأرشيف)</h2>
          {user.isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleAdminAdd(RecordType.ATTENDANCE)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow">➕ إضافة سجل سابق</button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs opacity-60 mr-2 font-bold">البحث باسم الموظف</label>
            <input
              type="text" placeholder="اسم الموظف..." value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs opacity-60 mr-2 font-bold">البحث بالتاريخ (يوم/شهر/سنة)</label>
            <input
              type="text" placeholder="مثال: 25/12/2024" value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleSearchClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🔍</span> بحث
            </button>
          </div>
        </div>
      </div>

      {Object.entries(groupedRecords).length === 0 ? (
        <div className={`${cardClasses} p-20 text-center opacity-40 rounded-3xl`}>لا توجد نتائج بحث مطابقة</div>
      ) : (
        (Object.entries(groupedRecords) as [string, AttendanceRecord[]][]).map(([dayLabel, dayRecords]) => (
          <div key={dayLabel} className={`${cardClasses} rounded-3xl overflow-hidden`}>
            <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-sm">{dayLabel}</h3>
              <button onClick={() => exportToCSV(dayRecords, dayLabel)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">📥 إكسيل لليوم</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className={`${tableHeaderClasses} text-[10px] uppercase`}>
                  <tr>
                    <th className="px-6 py-3">الموظف</th>
                    <th className="px-6 py-3">الحالة</th>
                    <th className="px-6 py-3">الفرع</th>
                    <th className="px-6 py-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dayRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-sm">{record.userName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          record.type === RecordType.ATTENDANCE || record.type === RecordType.LOC_ATTENDANCE 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] opacity-70">
                        {record.branchName || '--'}
                      </td>
                      <td className="px-6 py-4">
                        {user.isAdmin && (
                          <div className="flex gap-1">
                            <button onClick={() => onDeleteRecord(record.id)} className="p-1 hover:bg-white/10 rounded">🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default HistoryPage;
