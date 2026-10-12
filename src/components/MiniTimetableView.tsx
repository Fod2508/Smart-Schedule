import React, { useState, useMemo } from "react";
import {
  Clock,
  MapPin,
  Video,
  CheckCircle,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { ScheduleItem, ConflictItem, UiTheme } from "../types/schedule";
import { getThemeCategoryIcon } from "../utils/themeIcons";

interface MiniTimetableViewProps {
  weekDays: Date[];
  events: ScheduleItem[];
  conflicts: ConflictItem[];
  onSelectEvent: (event: ScheduleItem) => void;
  onNewEventAtSlot: (startISO: string, endISO: string) => void;
  onToggleComplete: (eventId: string) => void;
  onResolveConflict: (conflict: ConflictItem) => void;
  uiTheme?: UiTheme;
}

interface ShiftConfig {
  id: "early" | "morning" | "afternoon" | "evening" | "late";
  label: string;
  icon: string;
  periodLabel: string;
  timeRange: string;
  startH: number;
  endH: number;
  defaultStartH: number;
  defaultEndH: number;
}

export const MiniTimetableView: React.FC<MiniTimetableViewProps> = ({
  weekDays,
  events,
  conflicts,
  onSelectEvent,
  onNewEventAtSlot,
  onToggleComplete,
  onResolveConflict,
  uiTheme = "cute",
}) => {
  const localDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const todayStr = localDateStr(new Date());

  // Base Shifts Definition
  const baseShifts: ShiftConfig[] = [
    {
      id: "morning",
      label: "Buổi Sáng",
      icon: "🌅",
      periodLabel: "Tiết 1 - 5",
      timeRange: "07:00 - 12:00",
      startH: 7,
      endH: 12,
      defaultStartH: 8,
      defaultEndH: 10,
    },
    {
      id: "afternoon",
      label: "Buổi Chiều",
      icon: "☀️",
      periodLabel: "Tiết 6 - 10",
      timeRange: "12:00 - 18:00",
      startH: 12,
      endH: 18,
      defaultStartH: 14,
      defaultEndH: 16,
    },
    {
      id: "evening",
      label: "Buổi Tối",
      icon: "🌙",
      periodLabel: "Tiết 11 - 14",
      timeRange: "18:00 - 22:30",
      startH: 18,
      endH: 22.5,
      defaultStartH: 19,
      defaultEndH: 21,
    },
  ];

  // Check if any events fall in early morning (< 07:00) or late night (>= 22:30)
  const hasEarlyEvents = useMemo(() => {
    return events.some((e) => {
      const s = new Date(e.startTime);
      return s.getHours() < 7;
    });
  }, [events]);

  const hasLateEvents = useMemo(() => {
    return events.some((e) => {
      const s = new Date(e.startTime);
      return s.getHours() >= 23 || (s.getHours() === 22 && s.getMinutes() >= 30);
    });
  }, [events]);

  const activeShifts = useMemo(() => {
    const list: ShiftConfig[] = [];
    if (hasEarlyEvents) {
      list.push({
        id: "early",
        label: "Sáng Sớm",
        icon: "🌄",
        periodLabel: "Trước 7h",
        timeRange: "05:00 - 07:00",
        startH: 5,
        endH: 7,
        defaultStartH: 6,
        defaultEndH: 7,
      });
    }
    list.push(...baseShifts);
    if (hasLateEvents) {
      list.push({
        id: "late",
        label: "Đêm Khuya",
        icon: "🌃",
        periodLabel: "Sau 22h",
        timeRange: "22:30 - 24:00",
        startH: 22.5,
        endH: 24,
        defaultStartH: 22,
        defaultEndH: 23,
      });
    }
    return list;
  }, [hasEarlyEvents, hasLateEvents]);

  // Helper to find events for a specific day and shift
  const getEventsForDayAndShift = (day: Date, shift: ShiftConfig) => {
    const dayStr = localDateStr(day);
    return events.filter((e) => {
      const s = new Date(e.startTime);
      const eDateStr = localDateStr(s);
      if (eDateStr !== dayStr) return false;
      const sHourDec = s.getHours() + s.getMinutes() / 60;
      return sHourDec >= shift.startH && sHourDec < shift.endH;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  // Smart Empty Compression: Determine if a shift is empty across the whole week
  const shiftEventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeShifts.forEach((shift) => {
      let count = 0;
      weekDays.forEach((day) => {
        count += getEventsForDayAndShift(day, shift).length;
      });
      counts[shift.id] = count;
    });
    return counts;
  }, [activeShifts, weekDays, events]);

  // Collapsed state for empty shifts (default collapsed if 0 events)
  const [collapsedShifts, setCollapsedShifts] = useState<Record<string, boolean>>({});

  const isShiftCollapsed = (shiftId: string) => {
    if (collapsedShifts[shiftId] !== undefined) {
      return collapsedShifts[shiftId];
    }
    // Auto-compress if completely empty
    return (shiftEventCounts[shiftId] || 0) === 0;
  };

  const toggleShiftCollapse = (shiftId: string) => {
    setCollapsedShifts((prev) => ({
      ...prev,
      [shiftId]: !isShiftCollapsed(shiftId),
    }));
  };

  // Helper to find conflict
  const getEventConflict = (eventId: string) => {
    const c = conflicts.find(
      (item) => item.eventA.id === eventId || item.eventB.id === eventId,
    );
    if (!c) return undefined;
    const otherEvent = c.eventA.id === eventId ? c.eventB : c.eventA;
    return { conflict: c, otherEvent };
  };

  return (
    <div className="p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Timetable Header Card */}
      <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-base select-none">🍱</span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Thời Khóa Biểu Mini</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/80 dark:border-indigo-800">
                Toàn bộ tuần • Vừa khít 1 màn hình
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="text-[11px] text-zinc-400">
            💡 Tự động nén ca trống • Nhấn vào ô để thêm môn/việc
          </span>
        </div>
      </div>

      {/* Main Timetable Matrix */}
      <div className="border border-zinc-200/90 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm">
        {/* Days Header (Columns: Ca/Buổi + 7 Days) */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] bg-zinc-100/90 dark:bg-zinc-800/90 border-b border-zinc-200/90 dark:border-zinc-800 text-center font-bold text-xs select-none">
          <div className="p-2 sm:p-2.5 flex items-center justify-center border-r border-zinc-200/80 dark:border-zinc-700/80 text-zinc-500 dark:text-zinc-400 text-[11px]">
            Ca / Buổi
          </div>

          {weekDays.map((day, idx) => {
            const dStr = localDateStr(day);
            const isToday = dStr === todayStr;
            const dayName = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][day.getDay()];

            return (
              <div
                key={idx}
                className={`p-2 border-r border-zinc-200/80 dark:border-zinc-700/80 last:border-r-0 transition-colors ${
                  isToday
                    ? "bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="text-[11px] font-semibold opacity-80">{dayName}</div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span
                    className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full text-[11px] font-bold ${
                      isToday
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal hidden md:inline">
                    /{day.getMonth() + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shift Rows */}
        <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
          {activeShifts.map((shift) => {
            const totalInShift = shiftEventCounts[shift.id] || 0;
            const isCollapsed = isShiftCollapsed(shift.id);

            // If collapsed: Render a slim compressed strip across the table
            if (isCollapsed) {
              return (
                <div
                  key={shift.id}
                  onClick={() => toggleShiftCollapse(shift.id)}
                  className="grid grid-cols-[80px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] bg-zinc-50/60 dark:bg-zinc-850/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition cursor-pointer group"
                  title="Nhấn để mở rộng ca này"
                >
                  <div className="p-1.5 sm:p-2 border-r border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-1 text-[11px] font-bold text-zinc-400 group-hover:text-indigo-600">
                    <span className="flex items-center gap-1 truncate">
                      <span>{shift.icon}</span>
                      <span className="hidden sm:inline">{shift.label}</span>
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </div>

                  <div className="col-span-7 p-1.5 text-center text-[10px] font-medium text-zinc-400 group-hover:text-indigo-500 flex items-center justify-center gap-2">
                    <span>
                      {shift.label} ({shift.timeRange}) — {totalInShift === 0 ? "Trống cả tuần" : `${totalInShift} việc`}
                    </span>
                    <span className="text-[9px] underline">Mở rộng ▼</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={shift.id}
                className="grid grid-cols-[80px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] min-h-[110px] transition-colors"
              >
                {/* Left Shift Header Column */}
                <div className="p-2 sm:p-2.5 bg-zinc-50/80 dark:bg-zinc-800/40 border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between select-none">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base">{shift.icon}</span>
                      <button
                        type="button"
                        onClick={() => toggleShiftCollapse(shift.id)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded transition"
                        title="Thu gọn ca này"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-1">
                      {shift.label}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-medium">
                      {shift.timeRange}
                    </div>
                  </div>

                  <div className="mt-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 font-bold text-[9px]">
                      {shift.periodLabel}
                    </span>
                  </div>
                </div>

                {/* 7 Day Slot Cells */}
                {weekDays.map((day, dIdx) => {
                  const dayEvents = getEventsForDayAndShift(day, shift);
                  const dayStr = localDateStr(day);
                  const isToday = dayStr === todayStr;

                  const defaultStartISO = `${dayStr}T${String(shift.defaultStartH).padStart(2, "0")}:00:00`;
                  const defaultEndISO = `${dayStr}T${String(shift.defaultEndH).padStart(2, "0")}:00:00`;

                  return (
                    <div
                      key={dIdx}
                      className={`relative p-1.5 border-r border-zinc-200/70 dark:border-zinc-800/80 last:border-r-0 flex flex-col gap-1.5 transition-colors group ${
                        isToday
                          ? "bg-indigo-50/30 dark:bg-indigo-950/20"
                          : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                      }`}
                      onClick={() => {
                        if (dayEvents.length === 0) {
                          onNewEventAtSlot(defaultStartISO, defaultEndISO);
                        }
                      }}
                    >
                      {/* Empty Slot Hover Button */}
                      {dayEvents.length === 0 && (
                        <div className="hidden group-hover:flex items-center justify-center h-full text-indigo-400 dark:text-indigo-300 gap-1 text-[10px] font-bold cursor-pointer">
                          <Plus className="w-3 h-3" />
                          <span>Thêm</span>
                        </div>
                      )}

                      {/* Event Cards inside Shift Slot */}
                      {dayEvents.map((ev) => {
                        const start = new Date(ev.startTime);
                        const end = new Date(ev.endTime);
                        const conflictInfo = getEventConflict(ev.id);

                        const timeLabel = `${start.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} - ${end.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`;

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(ev);
                            }}
                            className={`p-2 rounded-xl border text-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs cursor-pointer flex flex-col justify-between gap-1 select-none ${
                              conflictInfo
                                ? "bg-rose-50/95 dark:bg-rose-950/80 border-rose-400 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400/50"
                                : ev.category === "study"
                                  ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100"
                                  : ev.category === "work"
                                    ? "bg-purple-50/90 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100"
                                    : ev.category === "meeting"
                                      ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100"
                                      : ev.category === "break"
                                        ? "bg-amber-50/90 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100"
                                        : "bg-pink-50/90 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800 text-pink-950 dark:text-pink-100"
                            } ${ev.isCompleted ? "opacity-55" : ""}`}
                          >
                            {/* Card Top: Chibi Sticker / Category & Time */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                {uiTheme !== "default" ? (
                                  <img
                                    src={getThemeCategoryIcon(ev.category, uiTheme)}
                                    alt=""
                                    className="w-4.5 h-4.5 rounded-md object-contain bg-white/80 dark:bg-zinc-800/80 p-0.5 shadow-2xs border border-white/90 shrink-0"
                                  />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                )}
                                <span className="text-[9px] font-bold opacity-80 truncate">
                                  {timeLabel}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleComplete(ev.id);
                                }}
                                className={`shrink-0 transition-transform active:scale-75 ${
                                  ev.isCompleted
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-zinc-400 hover:text-emerald-500"
                                }`}
                                title={ev.isCompleted ? "Đã xong" : "Đánh dấu hoàn thành"}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Title (Bold like university timetable subject) */}
                            <div
                              className={`font-bold text-[11px] leading-tight line-clamp-2 ${
                                ev.isCompleted ? "line-through opacity-70" : ""
                              }`}
                            >
                              {ev.title}
                            </div>

                            {/* Card Bottom: Room / Location or Meet Link */}
                            <div className="flex items-center justify-between gap-1 text-[9px] opacity-80 pt-0.5">
                              {ev.location ? (
                                <span className="flex items-center gap-0.5 truncate font-medium">
                                  <MapPin className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                                  <span className="truncate">{ev.location}</span>
                                </span>
                              ) : ev.hasMeet ? (
                                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <Video className="w-2.5 h-2.5 shrink-0" />
                                  <span>Google Meet</span>
                                </span>
                              ) : (
                                <span className="text-zinc-400 capitalize">{ev.category}</span>
                              )}

                              {conflictInfo && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResolveConflict(conflictInfo.conflict);
                                  }}
                                  className="px-1 py-0.2 rounded bg-rose-600 text-white font-bold text-[8px] flex items-center gap-0.5 shrink-0"
                                  title="Trùng giờ"
                                >
                                  <AlertTriangle className="w-2 h-2" />
                                  <span>Trùng</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
