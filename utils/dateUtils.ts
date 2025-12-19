
export const getDayName = (date: Date): string => {
  return new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date);
};

/**
 * Determines the period name for a given date.
 * Period logic: From the 21st of the current month to the 20th of the next month.
 */
export const getPeriodLabel = (date: Date): string => {
  const day = date.getDate();
  let startMonth = date.getMonth();
  let startYear = date.getFullYear();

  // If day is <= 20, we are in the period that started on the 21st of the PREVIOUS month
  if (day <= 20) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  const startDate = new Date(startYear, startMonth, 21);
  const endMonth = (startMonth + 1) % 12;
  const endYear = startMonth === 11 ? startYear + 1 : startYear;
  const endDate = new Date(endYear, endMonth, 20);

  const formatter = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' });
  return `فترة: ${formatDate(startDate)} إلى ${formatDate(endDate)}`;
};

export const isToday = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};
