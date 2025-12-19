
import React, { useState, useEffect, useMemo } from 'react';
import { User, VacationRequest, VacationStatus } from '../types';
import { db, ref, onValue, push } from '../utils/firebase';
import { formatDate, getPeriodLabel } from '../utils/dateUtils';

interface VacationRequestPageProps {
  user: User;
  cardClasses: string;
  theme: string;
}

const VacationRequestPage: React.FC<VacationRequestPageProps> = ({ user, cardClasses, theme }) => {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [startDate, setStartDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    const vRef = ref(db, 'vacationRequests');
    const unsubscribe = onValue(vRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: VacationRequest[] = Object.keys(data)
          .map(key => ({ ...data[key], id: key }))
          .filter(r => r.userId === user.id);
        setRequests(list);
      } else {
        setRequests([]);
      }
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleRequest = () => {
    if (!startDate || !returnDate || daysCount <= 0) {
      alert('يرجى إكمال جميع البيانات');
      return;
    }
    const vRef = ref(db, 'vacationRequests');
    const newReq = {
      userId: user.id,
      userName: user.username,
      startDate,
      endDate: startDate, // Simplified for now
      returnDate,
      daysCount,
      status: VacationStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    push(vRef, newReq).then(() => {
      alert('تم إرسال طلب الإجازة بنجاح');
      setShowModal(false);
      setStartDate(''); setReturnDate(''); setDaysCount(1);
    });
  };

  const groupedRequests = useMemo(() => {
    const groups: { [key: string]: VacationRequest[] } = {};
    requests.forEach(r => {
      const period = getPeriodLabel(new Date(r.startDate));
      if (!groups[period]) groups[period] = [];
      groups[period].push(r);
    });
    return groups;
  }, [requests]);

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6`}>
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 bg-blue-500/20 text-blue-500 flex items-center justify-center rounded-full text-3xl">👤</div>
           <div>
              <h2 className="text-2xl font-black">{user.username}</h2>
              <p className="opacity-60 text-sm italic">موظف مفعل - طلبات الإجازة</p>
           </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-3xl font-black shadow-2xl transition-all active:scale-95 text-lg"
        >
          ➕ أضف إجازة
        </button>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedRequests).length === 0 ? (
          <div className={`${cardClasses} p-20 text-center opacity-40 rounded-3xl`}>لا توجد طلبات إجازة مسجلة</div>
        ) : (
          // Add explicit type casting to Object.entries to resolve 'map' property error on unknown type
          (Object.entries(groupedRequests) as [string, VacationRequest[]][]).map(([period, items]) => (
            <div key={period} className={`${cardClasses} rounded-3xl overflow-hidden`}>
               <div className="bg-white/5 p-4 border-b border-white/10 font-bold">{period}</div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                 {items.map(req => (
                   <div key={req.id} className="p-5 bg-black/5 dark:bg-white/5 rounded-2xl border border-white/5 space-y-2 relative">
                      <div className={`absolute top-4 left-4 text-[10px] font-bold px-2 py-1 rounded-full ${
                        req.status === VacationStatus.APPROVED ? 'bg-green-500 text-white' :
                        req.status === VacationStatus.REJECTED ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {req.status}
                      </div>
                      <div className="text-sm opacity-60">تاريخ الإجازة:</div>
                      <div className="font-bold">{req.startDate}</div>
                      <div className="flex justify-between text-xs mt-4">
                        <span>عدد الأيام: {req.daysCount}</span>
                        <span>العودة: {req.returnDate}</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className={`${cardClasses} w-full max-w-md p-8 rounded-[40px] space-y-6 shadow-2xl`}>
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black">📝 طلب إجازة جديد</h3>
                 <button onClick={() => setShowModal(false)} className="text-2xl opacity-50">✖</button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 mr-2">تاريخ بداية الإجازة</label>
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full p-4 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 mr-2">عدد أيام الإجازة</label>
                    <input type="number" value={daysCount} onChange={e=>setDaysCount(parseInt(e.target.value))} className="w-full p-4 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 mr-2">تاريخ العودة للعمل</label>
                    <input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} className="w-full p-4 bg-black/5 dark:bg-white/10 rounded-2xl outline-none" />
                 </div>
                 <button 
                  onClick={handleRequest}
                  className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-all mt-4"
                >طلب إجازة</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default VacationRequestPage;
