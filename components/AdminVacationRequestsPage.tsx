
import React, { useState, useEffect, useMemo } from 'react';
import { User, VacationRequest, VacationStatus } from '../types';
import { db, ref, onValue, update, remove } from '../utils/firebase';
import { formatDate, getPeriodLabel } from '../utils/dateUtils';

interface AdminVacationRequestsPageProps {
  cardClasses: string;
  theme: string;
  users: User[];
}

const AdminVacationRequestsPage: React.FC<AdminVacationRequestsPageProps> = ({ cardClasses, theme, users }) => {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<VacationRequest | null>(null);

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

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      const vRef = ref(db, `vacationRequests/${id}`);
      remove(vRef).then(() => alert('تم حذف الطلب بنجاح'));
    }
  };

  const handleEditClick = (req: VacationRequest) => {
    setEditingRequest({ ...req });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!editingRequest) return;
    const vRef = ref(db, `vacationRequests/${editingRequest.id}`);
    update(vRef, {
      startDate: editingRequest.startDate,
      returnDate: editingRequest.returnDate,
      daysCount: editingRequest.daysCount,
      status: editingRequest.status
    }).then(() => {
      alert('تم تحديث الطلب بنجاح');
      setShowEditModal(false);
    });
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
          <select 
             className="w-full p-3 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" 
             value={searchName} 
             onChange={e=>setSearchName(e.target.value)} 
          >
             <option value="">-- بحث باسم الموظف --</option>
             {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
          </select>
          <input 
             className="w-full p-3 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" 
             placeholder="بحث بالتاريخ (YYYY-MM-DD)..." 
             value={searchDate} 
             onChange={e=>setSearchDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-6">
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
                        <td className="px-6 py-4">
                           <div className="flex gap-2">
                             <button onClick={()=>handleEditClick(req)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg">✏️</button>
                             <button onClick={()=>handleDelete(req.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">🗑️</button>
                             {req.status === VacationStatus.PENDING && (
                               <>
                                 <button onClick={()=>handleStatus(req.id, VacationStatus.APPROVED)} className="bg-green-500/10 text-green-500 p-2 rounded-lg font-bold text-xs">موافق</button>
                                 <button onClick={()=>handleStatus(req.id, VacationStatus.REJECTED)} className="bg-red-500/10 text-red-500 p-2 rounded-lg font-bold text-xs">غير موافق</button>
                               </>
                             )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        ))}
      </div>

      {showEditModal && editingRequest && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className={`${cardClasses} w-full max-w-md p-8 rounded-[40px] space-y-6 shadow-2xl`}>
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black">✏️ تعديل طلب الإجازة</h3>
                 <button onClick={() => setShowEditModal(false)} className="text-2xl opacity-50">✖</button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 mr-2">تاريخ البداية</label>
                    <input type="date" value={editingRequest.startDate} onChange={e=>setEditingRequest({...editingRequest, startDate: e.target.value})} className="w-full p-4 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 mr-2">عدد الأيام</label>
                    <input type="number" value={editingRequest.daysCount} onChange={e=>setEditingRequest({...editingRequest, daysCount: parseInt(e.target.value)})} className="w-full p-4 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 mr-2">تاريخ العودة</label>
                    <input type="date" value={editingRequest.returnDate} onChange={e=>setEditingRequest({...editingRequest, returnDate: e.target.value})} className="w-full p-4 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 mr-2">الحالة</label>
                    <select value={editingRequest.status} onChange={e=>setEditingRequest({...editingRequest, status: e.target.value as VacationStatus})} className="w-full p-4 bg-black/5 dark:bg-white/10 rounded-2xl outline-none">
                       {Object.values(VacationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <button 
                  onClick={handleUpdate}
                  className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-all mt-4"
                >تحديث الطلب</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminVacationRequestsPage;
