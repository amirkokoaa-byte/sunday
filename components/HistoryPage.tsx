
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, RecordType, User } from '../types';
import { formatDate, getPeriodLabel } from '../utils/dateUtils';
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    return records
      .filter(record => record.isPrivate === false || record.isPrivate === undefined)
      .filter(record => 
        record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.branchName && record.branchName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        formatDate(new Date(record.date)).includes(searchTerm)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm]);

  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: AttendanceRecord[] } = {};
    filteredRecords.forEach(record => {
      const period = getPeriodLabel(new Date(record.date));
      if (!groups[period]) groups[period] = [];
      groups[period].push(record);
    });
    return groups;
  }, [filteredRecords]);

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
      <div className={`${cardClasses} p-6 rounded-3xl space-y-4`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">سجل الحضور السابق</h2>
          {user.isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleAdminAdd(RecordType.ATTENDANCE)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow">➕ إضافة حضور سابق</button>
              <button onClick={() => handleAdminAdd(RecordType.VACATION)} className="bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow">🏖️ إضافة إجازة سابقة</button>
              <button onClick={() => handleAdminAdd(RecordType.MISSION)} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow">🚗 إضافة مأمورية سابقة</button>
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="text" placeholder="البحث عن موظف أو تاريخ أو فرع..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {(Object.entries(groupedRecords) as [string, AttendanceRecord[]][]).map(([period, periodRecords]) => (
        <div key={period} className={`${cardClasses} rounded-3xl overflow-hidden`}>
          <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold">{period}</h3>
            <button onClick={() => exportToCSV(periodRecords, period)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">📊 إكسيل</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className={`${tableHeaderClasses} text-xs uppercase`}>
                <tr>
                  <th className="px-6 py-3">الموظف</th>
                  <th className="px-6 py-3">التاريخ</th>
                  <th className="px-6 py-3">الحالة</th>
                  <th className="px-6 py-3">الفرع / الموقع</th>
                  <th className="px-6 py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {periodRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{record.userName}</td>
                    <td className="px-6 py-4 opacity-70 text-sm">{formatDate(new Date(record.date))}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        record.type === RecordType.ATTENDANCE || record.type === RecordType.LOC_ATTENDANCE 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {record.branchName && (
                        <div className="flex flex-col gap-1">
                          <span className="font-bold">{record.branchName}</span>
                          {record.locationLink && (
                            <a href={record.locationLink} target="_blank" rel="noreferrer" className="text-blue-500 underline">خرائط جوجل 📍</a>
                          )}
                        </div>
                      )}
                      {!record.branchName && <span className="opacity-30">--</span>}
                    </td>
                    <td className="px-6 py-4">
                      {user.isAdmin && (
                        <div className="flex gap-1">
                          <button onClick={() => {
                            const nt = prompt('النوع الجديد:', record.type);
                            if(nt) onUpdateRecord(record.id, { type: nt as RecordType });
                          }} className="p-1 hover:bg-white/10 rounded">✏️</button>
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
      ))}
    </div>
  );
};

export default HistoryPage;
