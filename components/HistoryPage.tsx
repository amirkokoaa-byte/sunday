
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, RecordType } from '../types';
import { formatDate, getPeriodLabel } from '../utils/dateUtils';
import { exportToCSV } from '../utils/excelUtils';

interface HistoryPageProps {
  records: AttendanceRecord[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  cardClasses: string;
  theme: string;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ records, onDeleteRecord, onUpdateRecord, cardClasses, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // يعرض السجلات التي ليست خاصة (isPrivate = false) لجميع الموظفين
  const filteredRecords = useMemo(() => {
    return records
      .filter(record => record.isPrivate === false || record.isPrivate === undefined)
      .filter(record => 
        record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const entries = useMemo(() => Object.entries(groupedRecords) as [string, AttendanceRecord[]][], [groupedRecords]);

  const handleExport = (periodLabel: string, periodRecords: AttendanceRecord[]) => {
    exportToCSV(periodRecords, periodLabel);
  };

  const tableHeaderClasses = theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-white border-b border-gray-50 text-gray-400';

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4`}>
        <div className="w-full md:flex-1">
          <h2 className="text-2xl font-bold mb-4">سجل الحضور العام</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="البحث عن اسم موظف أو تاريخ معين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className={`${cardClasses} p-12 text-center rounded-3xl border border-dashed border-white/20`}>
          <p className="opacity-40 text-lg italic">لا توجد سجلات عامة مطابقة للبحث</p>
        </div>
      ) : (
        entries.map(([period, periodRecords]) => (
          <div key={period} className={`${cardClasses} rounded-3xl overflow-hidden`}>
            <div className="bg-white/5 p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
              <h3 className="font-bold flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                {period}
              </h3>
              <button 
                onClick={() => handleExport(period, periodRecords)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <span>📊</span>
                تصدير إكسيل
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className={`${tableHeaderClasses} text-xs uppercase`}>
                  <tr>
                    <th className="px-6 py-3 font-semibold">الموظف</th>
                    <th className="px-6 py-3 font-semibold">اليوم</th>
                    <th className="px-6 py-3 font-semibold">التاريخ</th>
                    <th className="px-6 py-3 font-semibold">الحالة</th>
                    <th className="px-6 py-3 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {periodRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{record.userName}</td>
                      <td className="px-6 py-4 opacity-70">{record.dayName}</td>
                      <td className="px-6 py-4 opacity-70 font-mono text-sm">{formatDate(new Date(record.date))}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          record.type === RecordType.ATTENDANCE ? 'bg-green-500/10 text-green-500' :
                          record.type === RecordType.VACATION ? 'bg-orange-500/10 text-orange-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2 justify-end">
                        <button 
                          onClick={() => {
                            if(confirm('هل انت متأكد من حذف هذا السجل؟')) onDeleteRecord(record.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="حذف"
                        >🗑️</button>
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
