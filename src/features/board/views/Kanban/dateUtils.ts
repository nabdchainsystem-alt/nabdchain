export const format = (date: Date, _fmt: string): string => {
  // Basic format implementation
  return date.toLocaleDateString();
};

export const addDays = (date: Date, amount: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

export const startOfWeek = (date: Date, _options?: { weekStartsOn?: number }): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

export const endOfWeek = (date: Date, _options?: { weekStartsOn?: number }): Date => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
};

export const addWeeks = (date: Date, amount: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount * 7);
  return result;
};

export const isSameDay = (dateLeft: Date, dateRight: Date): boolean => {
  return dateLeft.toDateString() === dateRight.toDateString();
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }): Date[] => {
  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const getDay = (date: Date): number => {
  return date.getDay();
};

export const setMonth = (date: Date, month: number): Date => {
  const result = new Date(date);
  result.setMonth(month);
  return result;
};

export const setYear = (date: Date, year: number): Date => {
  const result = new Date(date);
  result.setFullYear(year);
  return result;
};

export const parse = (dateString: string, _formatString: string, _referenceDate: Date): Date => {
  return new Date(dateString); // Simplified
};

export const isValid = (date: unknown): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isBefore = (date: Date, dateToCompare: Date): boolean => {
  return date.getTime() < dateToCompare.getTime();
};

export const isAfter = (date: Date, dateToCompare: Date): boolean => {
  return date.getTime() > dateToCompare.getTime();
};
