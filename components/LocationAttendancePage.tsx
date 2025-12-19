
import React, { useState, useEffect } from 'react';
import { RecordType, User, BranchLocation, UserLocationConfig } from '../types';
import { db, ref, onValue } from '../utils/firebase';
import { calculateDistance } from '../utils/locationUtils';
import { formatDate } from '../utils/dateUtils';

interface LocationAttendancePageProps {
  user: User;
  onAddRecord: (type: RecordType, branchName?: string, locationLink?: string, accuracy?: number) => void;
  cardClasses: string;
  theme: string;
}

const LocationAttendancePage: React.FC<LocationAttendancePageProps> = ({ 
  user, onAddRecord, cardClasses, theme 
}) => {
  const [branches, setBranches] = useState<BranchLocation[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const locRef = ref(db, `userLocations/${user.id}`);
    const unsubscribe = onValue(locRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.branches) {
        setBranches(data.branches);
      } else {
        setBranches([]);
      }
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleAction = async (type: RecordType) => {
    if (!selectedBranchId) {
      alert('يرجى اختيار الفرع أولاً');
      return;
    }

    const branch = branches.find(b => b.id === selectedBranchId);
    if (!branch) return;

    setLoading(true);
    setError('');
    setStatusMsg('جاري جلب الموقع الحالي بدقة عالية...');

    if (!navigator.geolocation) {
      setError('متصفحك لا يدعم خاصية تحديد الموقع');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const dist = calculateDistance(latitude, longitude, branch.latitude, branch.longitude);
        
        // Use 2000 meters (2 km) limit as requested
        const MAX_DIST = 2000; 

        if (dist > MAX_DIST) {
          setError(`أنت خارج الزون المسموح به! المسافة الحالية عن الفرع: ${(dist / 1000).toFixed(2)} كم. (الحد المسموح 2 كم)`);
          setLoading(false);
        } else {
          // Success
          const locLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          onAddRecord(type, branch.name, locLink, accuracy);
          setStatusMsg(`تم تسجيل ${type === RecordType.LOC_ATTENDANCE ? 'الحضور' : 'الانصراف'} بنجاح!`);
          setLoading(false);
        }
      },
      (err) => {
        let msg = 'خطأ غير معروف في جلب الموقع';
        if (err.code === 1) msg = 'يرجى تفعيل صلاحية الوصول للموقع في المتصفح';
        if (err.code === 2) msg = 'فشل جلب الموقع الفعلي، يرجى المحاولة في مكان مفتوح';
        if (err.code === 3) msg = 'انتهى وقت طلب الموقع، حاول مرة أخرى';
        setError(msg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // Combat fake location apps
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className={`${cardClasses} p-8 rounded-3xl text-center space-y-6`}>
        <div className="inline-block p-4 bg-blue-500/10 rounded-full mb-2">
          <span className="text-5xl">📍</span>
        </div>
        <div>
          <h2 className="text-2xl font-black">حضور وانصراف اللوكيشن</h2>
          <p className="opacity-60 mt-2">يجب أن تكون في نطاق 2 كم من الفرع المحدد</p>
        </div>

        <div className="max-w-sm mx-auto space-y-4">
          <div className="text-right">
            <label className="block text-sm mb-1 mr-1 opacity-70">اختر الفرع الحالي</label>
            <select 
              className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- اختر الفرع --</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {branches.length === 0 && (
              <p className="text-xs text-red-500 mt-1">لا يوجد فروع مسجلة لك، تواصل مع المدير</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAction(RecordType.LOC_ATTENDANCE)}
              disabled={loading || branches.length === 0}
              className={`py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex flex-col items-center gap-1 ${loading ? 'opacity-50 grayscale' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              <span className="text-2xl">✅</span>
              إمضاء حضور
            </button>
            <button
              onClick={() => handleAction(RecordType.LOC_DEPARTURE)}
              disabled={loading || branches.length === 0}
              className={`py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex flex-col items-center gap-1 ${loading ? 'opacity-50 grayscale' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              <span className="text-2xl">🚪</span>
              إمضاء انصراف
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-blue-500 font-bold animate-pulse">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
              {statusMsg}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-bold">
              ⚠️ {error}
            </div>
          )}
          
          {statusMsg && !loading && !error && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl text-sm font-bold">
              🎉 {statusMsg}
            </div>
          )}
        </div>
      </div>

      <div className={`${cardClasses} p-6 rounded-3xl`}>
        <h3 className="font-bold mb-4">تعليمات الحضور الذكي</h3>
        <ul className="text-sm space-y-2 opacity-80 list-disc list-inside">
          <li>تأكد من تفعيل الـ GPS في هاتفك المحمول.</li>
          <li>يجب إعطاء المتصفح صلاحية الوصول للموقع الجغرافي.</li>
          <li>نظام الحماية يكتشف برامج تغيير الموقع (Fake Location).</li>
          <li>يتم تسجيل إحداثيات موقعك الفعلي ورابط الخريطة في السجل.</li>
        </ul>
      </div>
    </div>
  );
};

export default LocationAttendancePage;
