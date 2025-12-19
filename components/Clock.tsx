
import React, { useState, useEffect } from 'react';
import { formatDate, getDayName } from '../utils/dateUtils';

const Clock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = now.toLocaleTimeString('ar-EG', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  });

  return (
    <div className="text-left font-bold space-y-1">
      <div className="text-lg md:text-xl text-blue-500 font-mono" dir="ltr">{timeString}</div>
      <div className="text-xs md:text-sm text-gray-400">
        {getDayName(now)} - {formatDate(now)}
      </div>
    </div>
  );
};

export default Clock;
