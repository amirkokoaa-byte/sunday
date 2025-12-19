
import { AttendanceRecord } from '../types';
import { formatDate } from './dateUtils';

export const exportToCSV = (records: AttendanceRecord[], periodLabel: string) => {
  const headers = ["اسم الموظف", "اليوم", "التاريخ", "الحالة"];
  
  const rows = records.map(record => [
    record.userName,
    record.dayName,
    formatDate(new Date(record.date)),
    record.type
  ]);

  // Create CSV content with BOM for Excel RTL support
  const csvContent = "\uFEFF" + [
    [periodLabel],
    headers,
    ...rows
  ].map(e => e.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `حضور_انصراف_${periodLabel.replace(/[/\\?%*:|"<>]/g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
