const DaysOfWeekEnum = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
} as const;

export const daysOfWeekOptions = Object.entries(DaysOfWeekEnum).map(([key, value]) => ({
  id: value.toString(), // value must be string for select value
  label: key.charAt(0) + key.slice(1).toLowerCase(), // 'MONDAY' -> 'Monday'
}));

export const getDayLabel = (dayNum: number) => {
  const option = daysOfWeekOptions.find(opt => opt.id === dayNum.toString());
  return option ? option.label : 'Unknown';
};
