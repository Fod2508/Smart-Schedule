import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Calendar as CalendarIcon,
  Plus,
  RotateCw,
  ExternalLink,
  Zap,
  Coffee,
  HeartPulse,
  Car,
  Navigation,
  MapPin,
} from "lucide-react";
import { ScheduleItem, ConflictItem, Chronotype } from "../types/schedule";

interface CalendarGridProps {
  currentDate: Date;
  onNavigateDate: (offsetDays: number) => void;
  onResetToday: () => void;
  events: ScheduleItem[];
  conflicts: ConflictItem[];
  onSelectEvent: (event: ScheduleItem) => void;
  onNewEventAtSlot: (startISO: string, endISO: string) => void;
  onResolveConflict: (conflict: ConflictItem) => void;
  onToggleComplete: (eventId: string) => void;
  viewMode: "week" | "day" | "agenda";
  onChangeViewMode: (mode: "week" | "day" | "agenda") => void;
  onSyncGoogleCalendar: () => void;
  isSyncing: boolean;
  chronotype?: Chronotype;
  showEnergyOverlay?: boolean;
  onOpenEnergyMatcher?: () => void;
  onOpenTravelBuffer?: () => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  onNavigateDate,
  onResetToday,
  events,
  conflicts,
  onSelectEvent,
  onNewEventAtSlot,
  onResolveConflict,
  onToggleComplete,
  viewMode,
  onChangeViewMode,
  onSyncGoogleCalendar,
  isSyncing,
  chronotype = "balanced",
  showEnergyOverlay = false,
  onOpenEnergyMatcher,
  onOpenTravelBuffer,
}) => {
  // Compute start of week (Monday)
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const weekStart = getMonday(currentDate);

  // Generate 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  // Hours: 07:00 to 22:00
  const START_HOUR = 7;
  const END_HOUR = 22;
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );

  // Check if a date is today
  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Helper to check if event is in a conflict and find the other conflicting event
  const getEventConflict = (
    eventId: string,
  ): { conflict: ConflictItem; otherEvent: ScheduleItem } | undefined => {
    const c = conflicts.find(
      (item) => item.eventA.id === eventId || item.eventB.id === eventId,
    );
    if (!c) return undefined;
    const otherEvent = c.eventA.id === eventId ? c.eventB : c.eventA;
    return { conflict: c, otherEvent };
  };

  // Helper to count conflicts for a specific day
  const getDayConflicts = (day: Date): ConflictItem[] => {
    const localDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayStr = localDateStr(day);
    return conflicts.filter((c) => {
      const sA = localDateStr(new Date(c.eventA.startTime));
      const sB = localDateStr(new Date(c.eventB.startTime));
      return sA === dayStr || sB === dayStr;
    });
  };

  // Helper to determine biological energy zone for an hour based on chronotype
  const getHourEnergyZone = (hour: number, type: Chronotype = "balanced") => {
    if (type === "morning_bird") {
      if (hour >= 7 && hour < 12) {
        return {
          level: "peak_focus",
          label: "⚡ Giờ vàng Đỉnh cao",
          bgClass: "bg-amber-500/[0.04] dark:bg-amber-500/[0.07]",
          textClass: "text-amber-600 dark:text-amber-400 font-semibold",
          borderClass: "border-l-3 border-l-amber-500",
        };
      }
      if (hour >= 13 && hour < 16) {
        return {
          level: "slump",
          label: "☕ Việc nhẹ / Slump",
          bgClass: "bg-orange-500/[0.04] dark:bg-orange-500/[0.07]",
          textClass: "text-orange-600 dark:text-orange-400 font-semibold",
          borderClass: "border-l-3 border-l-orange-400",
        };
      }
      if (hour >= 17 && hour <= 21) {
        return {
          level: "recovery",
          label: "🌿 Hồi phục / Thể thao",
          bgClass: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]",
          textClass: "text-emerald-600 dark:text-emerald-400 font-semibold",
          borderClass: "border-l-3 border-l-emerald-500",
        };
      }
    } else if (type === "night_owl") {
      if (hour >= 8 && hour < 11) {
        return {
          level: "recovery",
          label: "🌿 Khởi động chậm",
          bgClass: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]",
          textClass: "text-emerald-600 dark:text-emerald-400 font-semibold",
          borderClass: "border-l-3 border-l-emerald-500",
        };
      }
      if (hour >= 13 && hour < 16) {
        return {
          level: "slump",
          label: "☕ Slump sau trưa",
          bgClass: "bg-orange-500/[0.04] dark:bg-orange-500/[0.07]",
          textClass: "text-orange-600 dark:text-orange-400 font-semibold",
          borderClass: "border-l-3 border-l-orange-400",
        };
      }
      if (hour >= 16 && hour <= 22) {
        return {
          level: "peak_focus",
          label: "⚡ Giờ vàng Sáng tạo",
          bgClass: "bg-indigo-500/[0.04] dark:bg-indigo-500/[0.07]",
          textClass: "text-indigo-600 dark:text-indigo-400 font-semibold",
          borderClass: "border-l-3 border-l-indigo-500",
        };
      }
    } else {
      // balanced
      if (hour >= 9 && hour < 13) {
        return {
          level: "peak_focus",
          label: "⚡ Giờ vàng Đỉnh cao",
          bgClass: "bg-amber-500/[0.04] dark:bg-amber-500/[0.07]",
          textClass: "text-amber-600 dark:text-amber-400 font-semibold",
          borderClass: "border-l-3 border-l-amber-500",
        };
      }
      if (hour >= 13 && hour < 16) {
        return {
          level: "slump",
          label: "☕ Việc nhẹ / Slump",
          bgClass: "bg-orange-500/[0.04] dark:bg-orange-500/[0.07]",
          textClass: "text-orange-600 dark:text-orange-400 font-semibold",
          borderClass: "border-l-3 border-l-orange-400",
        };
      }
      if (hour >= 18 && hour <= 22) {
        return {
          level: "recovery",
          label: "🌿 Hồi phục & Thể thao",
          bgClass: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]",
          textClass: "text-emerald-600 dark:text-emerald-400 font-semibold",
          borderClass: "border-l-3 border-l-emerald-500",
        };
      }
    }
    return {
      level: "neutral",
      label: "",
      bgClass: "",
      textClass: "text-zinc-400 dark:text-zinc-500",
      borderClass: "",
    };
  };

  const categoryStyles: Record<
    string,
    { bg: string; border: string; text: string; dot: string }
  > = {
    study: {
      bg: "bg-blue-50 dark:bg-blue-950/70",
      border: "border-blue-300 dark:border-blue-800",
      text: "text-blue-900 dark:text-blue-200",
      dot: "bg-blue-500",
    },
    work: {
      bg: "bg-indigo-50 dark:bg-indigo-950/70",
      border: "border-indigo-300 dark:border-indigo-800",
      text: "text-indigo-900 dark:text-indigo-200",
      dot: "bg-indigo-500",
    },
    meeting: {
      bg: "bg-emerald-50 dark:bg-emerald-950/70",
      border: "border-emerald-300 dark:border-emerald-800",
      text: "text-emerald-900 dark:text-emerald-200",
      dot: "bg-emerald-500",
    },
    break: {
      bg: "bg-amber-50 dark:bg-amber-950/70",
      border: "border-amber-300 dark:border-amber-800",
      text: "text-amber-900 dark:text-amber-200",
      dot: "bg-amber-500",
    },
    personal: {
      bg: "bg-purple-50 dark:bg-purple-950/70",
      border: "border-purple-300 dark:border-purple-800",
      text: "text-purple-900 dark:text-purple-200",
      dot: "bg-purple-500",
    },
  };

  // Format month and year label
  const headerDateLabel = weekStart.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/90 dark:border-zinc-800 overflow-hidden flex flex-col">
      {/* Calendar Top Control Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navigation & Date Label */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateDate(viewMode === "day" ? -1 : -7)}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition cursor-pointer"
            aria-label="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onResetToday}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition cursor-pointer"
          >
            Hôm nay
          </button>
          <button
            onClick={() => onNavigateDate(viewMode === "day" ? 1 : 7)}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition cursor-pointer"
            aria-label="Tuần tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize ml-2">
            {headerDateLabel}
          </span>
        </div>

        {/* View Switcher & Sync */}
        <div className="flex items-center gap-2">
          {/* Google Calendar Sync button */}
          <button
            onClick={onSyncGoogleCalendar}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Đồng bộ 2 chiều với Google Calendar"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span className="hidden md:inline">
              {isSyncing ? "Đang sync..." : "Đồng bộ Google"}
            </span>
          </button>

          {/* View Mode buttons */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-xl text-xs">
            <button
              onClick={() => onChangeViewMode("week")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === "week"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => onChangeViewMode("day")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === "day"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => onChangeViewMode("agenda")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === "agenda"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Visual Conflict Notice Banner */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50/95 dark:bg-rose-950/70 border-b border-rose-200 dark:border-rose-900/70 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-100 font-medium">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              Phát hiện{" "}
              <strong className="font-bold underline decoration-rose-400 underline-offset-2">
                {conflicts.length} sự kiện trùng giờ
              </strong>
              . Các sự kiện này được gắn nhãn cảnh báo đỏ và hiệu ứng nhấp nháy
              trên lịch.
            </span>
          </div>
          <button
            onClick={() => onResolveConflict(conflicts[0])}
            className="shrink-0 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Mở giải quyết trùng lịch thông minh AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gỡ trùng lịch</span>
          </button>
        </div>
      )}

      {/* Agenda Mode */}
      {viewMode === "agenda" && (
        <div className="p-4 sm:p-6 divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[680px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              Chưa có lịch trình nào trong tuần này. Hãy sử dụng Gemini AI để
              xếp lịch nhanh!
            </div>
          ) : (
            events
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.startTime).getTime() -
                  new Date(b.startTime).getTime(),
              )
              .map((ev) => {
                const start = new Date(ev.startTime);
                const end = new Date(ev.endTime);
                const style =
                  categoryStyles[ev.category] || categoryStyles.personal;
                const conflictInfo = getEventConflict(ev.id);

                if (ev.isTravelBuffer) {
                  return (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className="py-2.5 px-3 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 flex items-center justify-between gap-3 text-xs my-1 cursor-pointer hover:bg-amber-100/60 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {ev.title}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400 block text-[11px] mt-0.5">
                            {start.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {end.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            • Đệm di chuyển & Chuẩn bị ({ev.bufferMinutes || 25}{" "}
                            phút)
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        🚗 Travel Buffer
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className={`py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 rounded-2xl transition cursor-pointer ${
                      conflictInfo
                        ? "bg-rose-50/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 conflict-pulse"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(ev.id);
                        }}
                        className={`mt-1 p-1 rounded-lg transition ${
                          ev.isCompleted
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
                            : "text-zinc-400 hover:text-zinc-600"
                        }`}
                        title={
                          ev.isCompleted
                            ? "Đã hoàn thành"
                            : "Đánh dấu hoàn thành"
                        }
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              ev.isCompleted
                                ? "line-through text-zinc-400 dark:text-zinc-500"
                                : "text-zinc-900 dark:text-zinc-100"
                            }`}
                          >
                            {ev.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${style.bg} ${style.text} border ${style.border}`}
                          >
                            {ev.category}
                          </span>
                          {conflictInfo && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onResolveConflict(conflictInfo.conflict);
                              }}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                              title={`Trùng ${conflictInfo.conflict.overlapMinutes} phút với "${conflictInfo.otherEvent.title}". Bấm để gỡ.`}
                            >
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                              </span>
                              <AlertTriangle className="w-3 h-3" />
                              <span>
                                Trùng {conflictInfo.conflict.overlapMinutes}p:{" "}
                                {conflictInfo.otherEvent.title}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {start.toLocaleDateString("vi-VN", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                            })}{" "}
                            •{" "}
                            {start.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {end.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {ev.isSyncedToGoogle && (
                            <span className="text-[10px] text-indigo-500 flex items-center gap-0.5">
                              • Google Calendar
                            </span>
                          )}
                        </div>

                        {ev.description && (
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {conflictInfo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolveConflict(conflictInfo.conflict);
                          }}
                          className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Gỡ trùng AI</span>
                        </button>
                      )}
                      {ev.hasMeet && (
                        <a
                          href={ev.meetLink || "https://meet.google.com/new"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-2xs transition"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Tham gia Meet</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Week & Day Grid View */}
      {viewMode !== "agenda" && (
        <div className="overflow-x-auto select-none">
          <div className="min-w-[850px]">
            {/* Days Header */}
            <div className="grid grid-cols-[70px_repeat(7,_1fr)] border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
              <div className="p-3 text-center text-xs font-semibold text-zinc-400 border-r border-zinc-200/80 dark:border-zinc-800">
                Giờ
              </div>
              {(viewMode === "day" ? [currentDate] : weekDays).map(
                (day, idx) => {
                  const dayIsToday = isToday(day);
                  const dayName = day.toLocaleDateString("vi-VN", {
                    weekday: "short",
                  });
                  const dateNumber = day.getDate();
                  const dayConflicts = getDayConflicts(day);

                  return (
                    <div
                      key={idx}
                      className={`p-3 text-center border-r border-zinc-200/80 dark:border-zinc-800 last:border-r-0 ${
                        dayIsToday
                          ? "bg-indigo-50/50 dark:bg-indigo-950/30"
                          : ""
                      } ${dayConflicts.length > 0 ? "bg-rose-50/40 dark:bg-rose-950/20" : ""}`}
                    >
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold flex items-center justify-center gap-1">
                        <span>{dayName}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <div
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            dayIsToday
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {dateNumber}
                        </div>
                      </div>
                      {dayConflicts.length > 0 && (
                        <div className="mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveConflict(dayConflicts[0]);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition cursor-pointer shadow-2xs"
                            title={`Có ${dayConflicts.length} sự kiện trùng giờ vào ngày này. Bấm để xem.`}
                          >
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                            </span>
                            <span>{dayConflicts.length} trùng</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>

            {/* Time Grid body */}
            <div className="relative max-h-[620px] overflow-y-auto">
              {hours.map((hour) => {
                const hourFormatted = `${hour.toString().padStart(2, "0")}:00`;
                const displayDays =
                  viewMode === "day" ? [currentDate] : weekDays;
                const energyZone = getHourEnergyZone(hour, chronotype);

                return (
                  <div
                    key={hour}
                    className={`grid ${
                      viewMode === "day"
                        ? "grid-cols-[70px_1fr]"
                        : "grid-cols-[70px_repeat(7,_1fr)]"
                    } min-h-[58px] border-b border-zinc-100 dark:border-zinc-800/60 transition-colors ${
                      showEnergyOverlay && energyZone.bgClass
                        ? `${energyZone.bgClass} ${energyZone.borderClass}`
                        : ""
                    }`}
                  >
                    {/* Time slot label */}
                    <div
                      className={`p-2 text-right pr-3 text-[11px] font-medium border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between ${
                        showEnergyOverlay && energyZone.textClass
                          ? energyZone.textClass
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      <span>{hourFormatted}</span>
                      {showEnergyOverlay && energyZone.level !== "neutral" && (
                        <span
                          className="text-[9px] font-bold opacity-80 truncate leading-none"
                          title={energyZone.label}
                        >
                          {energyZone.level === "peak_focus" && "⚡ Vàng"}
                          {energyZone.level === "slump" && "☕ Slump"}
                          {energyZone.level === "recovery" && "🌿 Nghỉ"}
                        </span>
                      )}
                    </div>

                    {/* Day slot columns */}
                    {displayDays.map((day, dIdx) => {
                      // Dùng local date để tránh lỗi timezone UTC vs local
                      const localDateStr = (d: Date) =>
                        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      const dayStr = localDateStr(day);
                      // Find events for this day and this hour
                      const slotEvents = events.filter((e) => {
                        const eStart = new Date(e.startTime);
                        const eDateStr = localDateStr(eStart);
                        return (
                          eDateStr === dayStr && eStart.getHours() === hour
                        );
                      });

                      const slotStartISO = `${dayStr}T${hour.toString().padStart(2, "0")}:00:00`;
                      const slotEndISO = `${dayStr}T${(hour + 1).toString().padStart(2, "0")}:00:00`;

                      return (
                        <div
                          key={dIdx}
                          onClick={() => {
                            if (slotEvents.length === 0) {
                              onNewEventAtSlot(slotStartISO, slotEndISO);
                            }
                          }}
                          className="relative p-1 border-r border-zinc-100 dark:border-zinc-800/60 last:border-r-0 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition group cursor-pointer overflow-hidden min-w-0"
                        >
                          {/* Plus button on hover */}
                          {slotEvents.length === 0 && (
                            <div className="hidden group-hover:flex items-center justify-center h-full text-zinc-300 dark:text-zinc-600">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          )}

                          {/* Events inside this slot */}
                          <div className="space-y-1 w-full min-w-0">
                            {slotEvents.map((ev) => {
                              const style =
                                categoryStyles[ev.category] ||
                                categoryStyles.personal;
                              const conflictInfo = getEventConflict(ev.id);
                              const start = new Date(ev.startTime);
                              const end = new Date(ev.endTime);
                              const timeLabel = `${start.toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )} - ${end.toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`;

                              if (ev.isTravelBuffer) {
                                return (
                                  <div
                                    key={ev.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectEvent(ev);
                                    }}
                                    className="p-1.5 rounded-xl border border-dashed border-amber-400 dark:border-amber-600 bg-amber-50/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 text-xs shadow-2xs transition-all hover:scale-[1.01] cursor-pointer"
                                    title={
                                      ev.description ||
                                      "Đệm di chuyển & Chuẩn bị"
                                    }
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1 font-bold truncate text-[11px]">
                                        <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <span className="truncate">
                                          {ev.title}
                                        </span>
                                      </div>
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200/90 dark:bg-amber-900/90 font-bold shrink-0 text-amber-900 dark:text-amber-200">
                                        {ev.bufferMinutes || 25}p
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center justify-between">
                                      <span>{timeLabel}</span>
                                      {ev.travelDestination && (
                                        <span className="truncate max-w-[85px] text-amber-700 dark:text-amber-300 font-medium">
                                          ➔ {ev.travelDestination}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectEvent(ev);
                                  }}
                                  className={`p-1.5 rounded-xl border text-xs shadow-2xs transition-all hover:scale-[1.01] ${
                                    conflictInfo
                                      ? "border-rose-500 bg-rose-50/95 dark:bg-rose-950/85 ring-1 ring-rose-400/60 text-rose-950 dark:text-rose-100 conflict-pulse shadow-sm shadow-rose-500/20"
                                      : `${style.bg} ${style.border} ${style.text}`
                                  } ${ev.isCompleted ? "opacity-50" : ""}`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="flex items-center gap-1 font-semibold truncate leading-tight flex-1">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                                      />
                                      <span
                                        className={`truncate ${ev.isCompleted ? "line-through" : ""}`}
                                      >
                                        {ev.title}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {/* Energy Level indicator if present */}
                                      {ev.energyLevel && (
                                        <span
                                          className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                                            ev.energyLevel === "peak_focus"
                                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/80"
                                              : ev.energyLevel === "light_admin"
                                                ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300/80"
                                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/80"
                                          }`}
                                          title={`Mức năng lượng: ${
                                            ev.energyLevel === "peak_focus"
                                              ? "Đỉnh cao (Deep Work)"
                                              : ev.energyLevel === "light_admin"
                                                ? "Việc nhẹ (Light Admin)"
                                                : "Hồi phục (Recovery)"
                                          }`}
                                        >
                                          {ev.energyLevel === "peak_focus"
                                            ? "⚡ Vàng"
                                            : ev.energyLevel === "light_admin"
                                              ? "☕ Nhẹ"
                                              : "🌿 Nghỉ"}
                                        </span>
                                      )}

                                      {/* Alert badge with red pulse indicator */}
                                      {conflictInfo && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onResolveConflict(
                                              conflictInfo.conflict,
                                            );
                                          }}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-2xs shrink-0 cursor-pointer transition"
                                          title={`Trùng ${conflictInfo.conflict.overlapMinutes} phút với: "${conflictInfo.otherEvent.title}". Bấm để gỡ.`}
                                        >
                                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                          </span>
                                          <AlertTriangle className="w-2.5 h-2.5" />
                                          <span>
                                            Trùng{" "}
                                            {
                                              conflictInfo.conflict
                                                .overlapMinutes
                                            }
                                            p
                                          </span>
                                        </button>
                                      )}
                                      {ev.hasMeet && (
                                        <Video className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                                    <span>{timeLabel}</span>
                                    {ev.isSyncedToGoogle && (
                                      <span className="text-[9px] text-indigo-500">
                                        G-Cal
                                      </span>
                                    )}
                                  </div>

                                  {ev.location && (
                                    <div className="mt-0.5 flex items-center gap-1 text-[9px] text-zinc-500 dark:text-zinc-400 truncate">
                                      <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                      <span className="truncate">
                                        {ev.location}
                                      </span>
                                    </div>
                                  )}

                                  {/* Conflict detail tag for instant conflict context at a glance */}
                                  {conflictInfo && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onResolveConflict(
                                          conflictInfo.conflict,
                                        );
                                      }}
                                      className="mt-1 flex items-center justify-between gap-1 p-1 rounded-lg bg-rose-100/90 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-[10px] text-rose-800 dark:text-rose-200 hover:bg-rose-200/90 transition cursor-pointer"
                                      title={`Xung đột với: "${conflictInfo.otherEvent.title}". Nhấp để giải quyết.`}
                                    >
                                      <span className="flex items-center gap-1 truncate font-medium flex-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        <span className="truncate">
                                          vs {conflictInfo.otherEvent.title}
                                        </span>
                                      </span>
                                      <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 shrink-0 bg-white/70 dark:bg-zinc-800/80 px-1 py-0.2 rounded border border-rose-200 dark:border-rose-700">
                                        Gỡ
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
