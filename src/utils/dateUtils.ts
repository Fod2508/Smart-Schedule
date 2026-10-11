export const getMondayOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday, 1 = Monday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getSundayOfWeek = (monday: Date): Date => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

export const formatWeekRange = (monday: Date, sunday: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const mStr = `${pad(monday.getDate())}/${pad(monday.getMonth() + 1)}`;
  const sStr = `${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}/${sunday.getFullYear()}`;
  return `${mStr} - ${sStr}`;
};

export const isEventInWeek = (
  startTime: string,
  endTime: string,
  monday: Date,
  sunday: Date
): boolean => {
  const s = new Date(startTime).getTime();
  const e = new Date(endTime).getTime();
  return s <= sunday.getTime() && e >= monday.getTime();
};

export const formatTimeShort = (isoString?: string): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
};

export const formatDateTimeShort = (isoString?: string): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const time = d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const day = d.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
    return `${time} (${day})`;
  } catch {
    return "";
  }
};
