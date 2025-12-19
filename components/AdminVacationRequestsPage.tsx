
import React, { useState, useEffect, useMemo } from 'react';
import { User, VacationRequest, VacationStatus } from '../types';
import { db, ref, onValue, update } from '../utils/firebase';
import { formatDate, getPeriodLabel } from '../utils/dateUtils';

interface AdminVacationRequestsPageProps {
  cardClasses: string;
  theme: string;
}

const AdminVacationRequestsPage: React.FC<AdminVacationRequestsPageProps> = ({ cardClasses, theme }) => {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    const vRef = ref(db, 'vacationRequests');
    const unsubscribe = onValue(vRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: VacationRequest[] = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setRequests(list);
      } else {
        setRequests([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleStatus = (id: string, status: VacationStatus) => {
    const vRef = ref(db, `vacationRequests/${id}`);
    update(vRef, { status }).then(() => alert(`تم ${status === VacationStatus.APPROVED ? 'القبول' : 'الرفض'}`));
  };

  const filteredRequests = useMemo(() => {
    return requests
      .filter(r => {
        const matchName = !searchName || r.userName.toLowerCase().includes(searchName.toLowerCase());
        const matchDate = !searchDate || r.startDate.includes(searchDate);
        return matchName && matchDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, searchName, searchDate]);

  const groupedRequests = useMemo(() => {
    const groups: { [key: string]: VacationRequest[] } = {};
    filteredRequests.forEach(r => {
      const period = getPeriodLabel(new Date(r.startDate));
      if (!groups[period]) groups[period] = [];
      groups[period].push(r);
    });
    return groups;
  }, [filteredRequests]);

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-6 rounded-3xl space-y-4`}>
        <h2 className="text-2xl font-black">📋 طلبات الإجازة المرسلة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
             className="w-full p-3 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" 
             placeholder="بحث باسم الموظف..." 
             value={searchName} 
             onChange={e=>setSearchName(e.target.value)} 
          />
          <input 
             className="w-full p-3 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" 
             placeholder="بحث بالتاريخ (YYYY-MM-DD)..." 
             value={searchDate} 
             onChange={e=>setSearchDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-6">
        // Fix: Add explicit type casting to Object.entries to resolve 'map' property error on unknown type
        {(Object.entries(groupedRequests) as [string, VacationRequest[]][]).map(([period, items]) => (
          <div key={period} className={`${cardClasses} rounded-3xl overflow-hidden`}>
             <div className="bg-white/5 p-4 border-b border-white/10 font-bold">{period}</div>
             <div className="overflow-x-auto">
               <table className="w-full text-right">
                  <thead className="bg-white/5 text-xs">
                    <tr>
                      <th className="px-6 py-4">الموظف</th>
                      <th className="px-6 py-4">البداية</th>
                      <th className="px-6 py-4">الأيام</th>
                      <th className="px-6 py-4">العودة</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map(req => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 font-bold">{req.userName}</td>
                        <td className="px-6 py-4 opacity-70">{req.startDate}</td>
                        <td className="px-6 py-4 font-mono">{req.daysCount}</td>
                        <td className="px-6 py-4 opacity-70">{req.returnDate}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-white ${
                              req.status === VacationStatus.APPROVED ? 'bg-green-600' : 
                              req.status === VacationStatus.REJECTED ? 'bg-red-600' : 'bg-orange-600'
                           }`}>{req.status}</span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                           {req.status === VacationStatus.PENDING && (
                             <>
                               <button onClick={()=>handleStatus(req.id, VacationStatus.APPROVED)} className="bg-green-500/10 text-green-500 p-2 rounded-lg font-bold text-xs">موافق</button>
                               <button onClick={()=>handleStatus(req.id, VacationStatus.REJECTED)} className="bg-red-500/10 text-red-500 p-2 rounded-lg font-bold text-xs">غير موافق</button>
                             </>
                           )}
                           {req.status !== VacationStatus.PENDING && <span className="opacity-30 text-xs italic">تم المعالجة</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminVacationRequestsPage;
