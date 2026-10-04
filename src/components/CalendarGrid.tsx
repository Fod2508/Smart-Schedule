import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Minus,
  RotateCw,
  ExternalLink,
  Zap,
  Coffee,
  HeartPulse,
  Car,
  Navigation,
  MapPin,
  Play,
  Check,
  GripVertical,
  BookOpen,
  Briefcase,
  Users,
  Heart,
} from "lucide-react";
import { ScheduleItem, ConflictItem, Chronotype, UiTheme } from "../types/schedule";
import { CuteCalendarFrame } from "./CuteCalendarFrame";
import { CapybaraCalendarFrame } from "./CapybaraCalendarFrame";
import { YohanCalendarFrame } from "./YohanCalendarFrame";

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
  onOpenPomodoroForEvent?: (event: ScheduleItem) => void;
  onOpenRescheduleForEvent?: (eventId: string) => void;
  onUpdateEventTimes?: (
    eventId: string,
    newStartTime: string,
    newEndTime: string,
  ) => void;
  onLoadSampleSchedule?: () => void;
  uiTheme?: UiTheme;
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
  onOpenPomodoroForEvent,
  onOpenRescheduleForEvent,
  onUpdateEventTimes,
  onLoadSampleSchedule,
  uiTheme = "cute",
}) => {
  // Realtime clock for Current Time Indicator
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Drag and Drop state
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Quick duration adjust (+30m, -30m)
  const handleAdjustDuration = (eventId: string, deltaMinutes: number) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev || !onUpdateEventTimes) return;
    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);
    const currentDurationMins = (end.getTime() - start.getTime()) / 60000;
    const newDurationMins = Math.max(15, currentDurationMins + deltaMinutes);
    const newEnd = new Date(start.getTime() + newDurationMins * 60000);
    onUpdateEventTimes(eventId, ev.startTime, newEnd.toISOString());
  };

  // Quick Event Popover preview on hover
  const [hoveredEvent, setHoveredEvent] = useState<{
    event: ScheduleItem;
    x: number;
    y: number;
  } | null>(null);
  const hoverTimeoutRef = useRef<any>(null);

  const handleMouseEnterEvent = (e: React.MouseEvent, ev: ScheduleItem) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEvent({
        event: ev,
        x: Math.min(rect.right + 8, window.innerWidth - 320),
        y: Math.min(rect.top, window.innerHeight - 260),
      });
    }, 200);
  };

  const handleMouseLeaveEvent = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEvent(null);
    }, 250);
  };
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
    { bg: string; border: string; text: string; dot: string; shadow: string; badge: string; iconImg: string; vectorIcon: React.ElementType }
  > = {
    study: {
      bg: "bg-gradient-to-br from-violet-400/20 via-purple-300/20 to-indigo-400/25 dark:from-violet-950/70 dark:via-purple-950/70 dark:to-indigo-950/80",
      border: "border-violet-300/90 dark:border-violet-700/80",
      text: "text-violet-950 dark:text-violet-100",
      dot: "bg-gradient-to-r from-violet-500 to-indigo-500 shadow-xs shadow-violet-500/50",
      shadow: "hover:shadow-lg hover:shadow-violet-400/25 dark:hover:shadow-violet-900/30",
      badge: "🎒",
      iconImg: "/illustrations/badge_study.jpg",
      vectorIcon: BookOpen,
    },
    work: {
      bg: "bg-gradient-to-br from-sky-400/20 via-blue-300/20 to-indigo-400/25 dark:from-sky-950/70 dark:via-blue-950/70 dark:to-indigo-950/80",
      border: "border-sky-300/90 dark:border-sky-700/80",
      text: "text-blue-950 dark:text-blue-100",
      dot: "bg-gradient-to-r from-sky-500 to-cyan-500 shadow-xs shadow-blue-500/50",
      shadow: "hover:shadow-lg hover:shadow-sky-400/25 dark:hover:shadow-sky-900/30",
      badge: "💻",
      iconImg: "/illustrations/badge_work.jpg",
      vectorIcon: Briefcase,
    },
    meeting: {
      bg: "bg-gradient-to-br from-emerald-400/20 via-teal-300/20 to-cyan-400/25 dark:from-emerald-950/70 dark:via-teal-950/70 dark:to-cyan-950/80",
      border: "border-emerald-300/90 dark:border-emerald-700/80",
      text: "text-emerald-950 dark:text-emerald-100",
      dot: "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-xs shadow-emerald-500/50",
      shadow: "hover:shadow-lg hover:shadow-emerald-400/25 dark:hover:shadow-emerald-900/30",
      badge: "💬",
      iconImg: "/illustrations/badge_meeting.jpg",
      vectorIcon: Users,
    },
    break: {
      bg: "bg-gradient-to-br from-amber-400/20 via-orange-300/20 to-yellow-400/25 dark:from-amber-950/70 dark:via-orange-950/70 dark:to-yellow-950/80",
      border: "border-amber-300/90 dark:border-amber-700/80",
      text: "text-amber-950 dark:text-amber-100",
      dot: "bg-gradient-to-r from-amber-500 to-orange-400 shadow-xs shadow-amber-500/50",
      shadow: "hover:shadow-lg hover:shadow-amber-400/25 dark:hover:shadow-amber-900/30",
      badge: "🧋",
      iconImg: "/illustrations/badge_break.jpg",
      vectorIcon: Coffee,
    },
    personal: {
      bg: "bg-gradient-to-br from-pink-400/20 via-rose-300/20 to-fuchsia-400/25 dark:from-pink-950/70 dark:via-rose-950/70 dark:to-fuchsia-950/80",
      border: "border-pink-300/90 dark:border-pink-700/80",
      text: "text-rose-950 dark:text-rose-100",
      dot: "bg-gradient-to-r from-pink-500 to-rose-400 shadow-xs shadow-rose-500/50",
      shadow: "hover:shadow-lg hover:shadow-pink-400/25 dark:hover:shadow-pink-900/30",
      badge: "🎁",
      iconImg: "/illustrations/badge_personal.jpg",
      vectorIcon: Heart,
    },
    travel: {
      bg: "bg-gradient-to-br from-teal-400/20 via-emerald-300/20 to-cyan-400/25 dark:from-teal-950/70 dark:via-emerald-950/70 dark:to-cyan-950/80",
      border: "border-teal-300/90 dark:border-teal-700/80",
      text: "text-teal-950 dark:text-teal-100",
      dot: "bg-gradient-to-r from-teal-500 to-emerald-400 shadow-xs shadow-teal-500/50",
      shadow: "hover:shadow-lg hover:shadow-teal-400/25 dark:hover:shadow-teal-900/30",
      badge: "🛵",
      iconImg: "/illustrations/badge_travel.jpg",
      vectorIcon: Navigation,
    },
  };

  // 3D Category Filter State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const categoryFilters = [
    { id: "all", label: "Tất cả", iconImg: null, emoji: "✨", vectorIcon: Sparkles },
    { id: "study", label: "Học tập", iconImg: "/illustrations/badge_study.jpg", emoji: "🎒", vectorIcon: BookOpen },
    { id: "work", label: "Công việc", iconImg: "/illustrations/badge_work.jpg", emoji: "💻", vectorIcon: Briefcase },
    { id: "meeting", label: "Họp nhóm", iconImg: "/illustrations/badge_meeting.jpg", emoji: "💬", vectorIcon: Users },
    { id: "break", label: "Nghỉ ngơi", iconImg: "/illustrations/badge_break.jpg", emoji: "🧋", vectorIcon: Coffee },
    { id: "personal", label: "Cá nhân", iconImg: "/illustrations/badge_personal.jpg", emoji: "🎁", vectorIcon: Heart },
    { id: "travel", label: "Di chuyển", iconImg: "/illustrations/badge_travel.jpg", emoji: "🛵", vectorIcon: Navigation },
  ];

  const getCategoryCount = (catId: string) => {
    if (catId === "all") return events.length;
    if (catId === "travel") return events.filter((e) => e.isTravelBuffer || e.transitMode).length;
    return events.filter((e) => e.category === catId && !e.isTravelBuffer).length;
  };

  const filteredEvents = React.useMemo(() => {
    if (selectedCategoryFilter === "all") return events;
    if (selectedCategoryFilter === "travel") {
      return events.filter((e) => e.isTravelBuffer || e.transitMode);
    }
    return events.filter((e) => e.category === selectedCategoryFilter && !e.isTravelBuffer);
  }, [events, selectedCategoryFilter]);

  // Format month and year label
  const headerDateLabel = weekStart.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`relative ${uiTheme === "cute" || uiTheme === "capybara" || uiTheme === "yohan" ? "pt-7 pb-8 px-1 sm:px-2" : ""}`}>
      {/* Cute Peeking Characters & Frame Decors (Bears, Rainbow, Washi Tape, Mascot) */}
      {uiTheme === "cute" && <CuteCalendarFrame />}
      {uiTheme === "capybara" && <CapybaraCalendarFrame />}
      {uiTheme === "yohan" && <YohanCalendarFrame />}

      <div
        className={`relative z-10 ${
          uiTheme === "yohan"
            ? "bg-[#FAF9F6]/95 dark:bg-[#18181B]/95 backdrop-blur-xl rounded-3xl shadow-xl border-2 border-zinc-900/80 dark:border-zinc-700/80"
            : uiTheme === "capybara"
              ? "bg-[#FFFDF8]/95 dark:bg-[#1E1712]/95 backdrop-blur-xl rounded-3xl shadow-xl border-2 border-dashed border-amber-300 dark:border-amber-750/70"
              : uiTheme === "cute"
                ? "bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl rounded-3xl shadow-xl border-2 border-amber-200/80 dark:border-zinc-700/80"
                : "bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl rounded-2xl shadow-lg border border-zinc-200/80 dark:border-zinc-800"
        } overflow-hidden flex flex-col transition-all`}
      >
        {/* Calendar Top Control Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navigation & Date Label */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateDate(viewMode === "day" ? -1 : -7)}
            className="p-2 rounded-2xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 transition cursor-pointer squishy-pop active:scale-90"
            aria-label="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onResetToday}
            className="px-3.5 py-1.5 rounded-2xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 border border-indigo-200/90 dark:border-indigo-800/90 transition cursor-pointer squishy-pop active:scale-95 shadow-2xs flex items-center gap-1"
          >
            <span>🌱</span>
            <span>Hôm nay</span>
          </button>
          <button
            onClick={() => onNavigateDate(viewMode === "day" ? 1 : 7)}
            className="p-2 rounded-2xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 transition cursor-pointer squishy-pop active:scale-90"
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

          {/* View Mode buttons with smooth motion layoutId */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-xl text-xs relative">
            {(["week", "day", "agenda"] as const).map((mode) => {
              const label =
                mode === "week"
                  ? "Tuần"
                  : mode === "day"
                    ? "Ngày"
                    : "Danh sách";
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onChangeViewMode(mode)}
                  className={`relative px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer z-10 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-300 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeViewTab"
                      className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-xs -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3D Category Showcase & Quick Filter Bar */}
      <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-3 sm:px-5 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline-block">
            Danh mục:
          </span>
          {categoryFilters.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            const count = getCategoryCount(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all duration-200 cursor-pointer squishy-pop ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs scale-102 ring-1 ring-indigo-500"
                    : "bg-zinc-100/90 hover:bg-zinc-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/70"
                }`}
              >
                {uiTheme === "cute" ? (
                  cat.iconImg ? (
                    <img
                      src={cat.iconImg}
                      alt={cat.label}
                      className="w-5 h-5 rounded-lg object-cover shadow-2xs border border-white/80 dark:border-zinc-700/80 shrink-0"
                    />
                  ) : (
                    <span className="text-xs">{cat.emoji}</span>
                  )
                ) : (
                  <cat.vectorIcon className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {onLoadSampleSchedule && (
          <button
            type="button"
            onClick={onLoadSampleSchedule}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Nạp lịch mẫu đầy đủ các hoạt động học tập, công việc, cà phê, họp nhóm"
          >
            <Sparkles className="w-3.5 h-3.5 animate-star-twinkle" />
            <span className="hidden md:inline">Nạp lịch mẫu trải nghiệm</span>
            <span className="md:hidden">Lịch mẫu</span>
          </button>
        )}
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

      {/* Animated View Container with AnimatePresence */}
      <AnimatePresence mode="wait">
        {viewMode === "agenda" ? (
          <motion.div
            key="agenda"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="p-4 sm:p-6 divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[680px] overflow-y-auto"
          >
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                {uiTheme === "yohan" ? (
                  <div className="relative inline-block">
                    <img
                      src="/illustrations/yohan/yohan_no.png"
                      alt="Go Yohan No Events"
                      className="w-32 h-36 mx-auto object-contain drop-shadow-md animate-mascot-wiggle"
                    />
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">
                      "NO... Chưa có lịch trình nào hết á!" ⁄(⁄ ⁄•⁄-⁄•⁄ ⁄)⁄
                    </div>
                  </div>
                ) : uiTheme === "capybara" ? (
                  <img
                    src="/illustrations/capybara_bath.png"
                    alt="Capybara Relax"
                    className="w-28 h-28 mx-auto object-contain drop-shadow-md animate-float-bob"
                  />
                ) : uiTheme === "cute" ? (
                  <img
                    src="/illustrations/empty_state_cat.jpg"
                    alt="Empty Schedule"
                    className="w-28 h-28 mx-auto rounded-3xl object-cover shadow-lg shadow-pink-500/10 border-2 border-white/80 dark:border-zinc-700/80 animate-float-bob"
                  />
                ) : (
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                    <CalendarIcon className="w-8 h-8" />
                  </div>
                )}
                <p className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">
                  {selectedCategoryFilter === "all"
                    ? "Chưa có lịch trình nào trong tuần này"
                    : `Không có sự kiện nào thuộc mục "${categoryFilters.find((c) => c.id === selectedCategoryFilter)?.label}"`}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Bấm vào khung giờ để thêm hoặc nhấn nút bên dưới để tạo lịch mẫu trải nghiệm ngay!
                </p>
                {onLoadSampleSchedule && (
                  <button
                    type="button"
                    onClick={onLoadSampleSchedule}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 animate-star-twinkle" />
                    <span>Nạp lịch mẫu đầy đủ hoạt động</span>
                  </button>
                )}
              </div>
            ) : (
              filteredEvents
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
                          {uiTheme === "cute" ? (
                            <img
                              src="/illustrations/badge_travel.jpg"
                              alt="travel"
                              className="w-8 h-8 rounded-xl object-cover shadow-2xs border border-amber-300 dark:border-amber-700 shrink-0"
                            />
                          ) : (
                            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                              <Navigation className="w-4 h-4" />
                            </div>
                          )}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            {uiTheme === "cute" ? (
                              <img
                                src={style.iconImg}
                                alt=""
                                className="w-7 h-7 rounded-xl object-cover shadow-xs border border-white/80 dark:border-zinc-700/80 shrink-0 select-none"
                              />
                            ) : (
                              <div className={`p-1.5 rounded-lg ${style.bg} ${style.text} ${style.border} border shrink-0`}>
                                <style.vectorIcon className="w-4 h-4" />
                              </div>
                            )}
                            <span
                              className={`font-bold text-sm ${
                                ev.isCompleted
                                  ? "line-through text-zinc-400 dark:text-zinc-500"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {ev.title}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${style.bg} ${style.text} border ${style.border}`}
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
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="overflow-x-auto select-none"
          >
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
                      className={`p-2 text-right pr-3 text-[11px] font-medium border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between transition-all ${
                        showEnergyOverlay && energyZone.textClass
                          ? energyZone.textClass
                          : "text-zinc-400 dark:text-zinc-500"
                      } ${showEnergyOverlay && energyZone.level === "peak_focus" ? "gold-glow bg-amber-500/10 dark:bg-amber-400/10 rounded-l-md font-semibold text-amber-600 dark:text-amber-400" : ""}`}
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
                      const slotEvents = filteredEvents.filter((e) => {
                        const eStart = new Date(e.startTime);
                        const eDateStr = localDateStr(eStart);
                        return (
                          eDateStr === dayStr && eStart.getHours() === hour
                        );
                      });

                      const slotStartISO = `${dayStr}T${hour.toString().padStart(2, "0")}:00:00`;
                      const slotEndISO = `${dayStr}T${(hour + 1).toString().padStart(2, "0")}:00:00`;
                      const slotKey = `${dayStr}_${hour}`;
                      const isDragOver = dragOverSlot === slotKey;

                      return (
                        <div
                          key={dIdx}
                          onClick={() => {
                            if (slotEvents.length === 0) {
                              onNewEventAtSlot(slotStartISO, slotEndISO);
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverSlot !== slotKey) {
                              setDragOverSlot(slotKey);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverSlot === slotKey) {
                              setDragOverSlot(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverSlot(null);
                            const droppedId =
                              e.dataTransfer.getData("text/plain") ||
                              draggingEventId;
                            if (!droppedId || !onUpdateEventTimes) return;

                            const targetEv = events.find(
                              (item) => item.id === droppedId,
                            );
                            if (!targetEv) return;

                            const origStart = new Date(targetEv.startTime);
                            const origEnd = new Date(targetEv.endTime);
                            const durationMs =
                              origEnd.getTime() - origStart.getTime();

                            const newStart = new Date(
                              `${dayStr}T${hour.toString().padStart(2, "0")}:${origStart.getMinutes().toString().padStart(2, "0")}:00`,
                            );
                            const newEnd = new Date(
                              newStart.getTime() + durationMs,
                            );

                            onUpdateEventTimes(
                              droppedId,
                              newStart.toISOString(),
                              newEnd.toISOString(),
                            );
                            setDraggingEventId(null);
                          }}
                          className={`relative p-1 border-r border-zinc-100 dark:border-zinc-800/60 last:border-r-0 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-all group cursor-pointer overflow-visible min-w-0 ${
                            isDragOver
                              ? "bg-indigo-100/70 dark:bg-indigo-950/80 ring-2 ring-indigo-500 rounded-lg scale-[0.99]"
                              : ""
                          }`}
                        >
                          {/* Realtime Current Time Horizontal Indicator */}
                          {isToday(day) && hour === currentTime.getHours() && (
                            <div
                              className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                              style={{ top: `${(currentTime.getMinutes() / 60) * 100}%` }}
                            >
                              <div className="relative flex items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80 -ml-1.25 animate-ping" />
                                <div className="w-2 h-2 rounded-full bg-rose-600 -ml-2" />
                                <span className="absolute -top-3.5 left-2 px-1.5 py-0.2 rounded-md bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                                  {currentTime.toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="h-[2px] flex-1 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 dark:from-rose-500 dark:to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
                            </div>
                          )}

                          {/* Plus button on hover */}
                          {slotEvents.length === 0 && (
                            <div className="hidden group-hover:flex items-center justify-center h-full text-indigo-400 dark:text-indigo-300 gap-1 text-[10px] font-bold">
                              <Plus className="w-3 h-3" />
                              <span>🌸 Thêm</span>
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
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.setData("text/plain", ev.id);
                                      e.dataTransfer.effectAllowed = "move";
                                      setDraggingEventId(ev.id);
                                      setHoveredEvent(null);
                                    }}
                                    onDragEnd={() => {
                                      setDraggingEventId(null);
                                      setDragOverSlot(null);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectEvent(ev);
                                    }}
                                    className={`p-1.5 rounded-2xl border border-dashed border-amber-400 dark:border-amber-600 bg-amber-50/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 text-xs shadow-2xs transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing squishy-pop ${
                                      draggingEventId === ev.id ? "opacity-30 scale-95" : ""
                                    }`}
                                    title={
                                      ev.description ||
                                      "Đệm di chuyển & Chuẩn bị (Kéo để dời)"
                                    }
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5 font-bold truncate text-[11px]">
                                        {uiTheme === "cute" ? (
                                          <img
                                            src="/illustrations/badge_travel.jpg"
                                            alt="travel"
                                            className="w-5.5 h-5.5 rounded-lg object-cover shadow-2xs border border-white/80 dark:border-zinc-700/80 shrink-0"
                                          />
                                        ) : (
                                          <Navigation className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        )}
                                        <span className="truncate">
                                          {ev.title}
                                        </span>
                                      </div>
                                      <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-200/90 dark:bg-amber-900/90 font-bold shrink-0 text-amber-900 dark:text-amber-200">
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
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.setData("text/plain", ev.id);
                                    e.dataTransfer.effectAllowed = "move";
                                    setDraggingEventId(ev.id);
                                    setHoveredEvent(null);
                                  }}
                                  onDragEnd={() => {
                                    setDraggingEventId(null);
                                    setDragOverSlot(null);
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectEvent(ev);
                                  }}
                                  onMouseEnter={(e) => handleMouseEnterEvent(e, ev)}
                                  onMouseLeave={handleMouseLeaveEvent}
                                  className={`p-1.5 sm:p-2 rounded-2xl border text-xs transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] cursor-grab active:cursor-grabbing backdrop-blur-xs select-none squishy-pop ${
                                    style.shadow || "shadow-xs"
                                  } ${
                                    conflictInfo
                                      ? "border-rose-500 bg-rose-50/95 dark:bg-rose-950/85 ring-1 ring-rose-400/60 text-rose-950 dark:text-rose-100 conflict-pulse shadow-md shadow-rose-500/30"
                                      : `${style.bg} ${style.border} ${style.text}`
                                  } ${ev.isCompleted ? "opacity-50" : ""} ${
                                    draggingEventId === ev.id
                                      ? "opacity-40 rotate-2 scale-105 shadow-2xl z-50 ring-2 ring-indigo-500"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="flex items-center gap-1.5 font-bold truncate leading-tight flex-1">
                                      {uiTheme === "cute" ? (
                                        <img
                                          src={style.iconImg}
                                          alt={ev.category}
                                          className="w-5.5 h-5.5 rounded-lg object-cover shadow-2xs border border-white/90 dark:border-zinc-700/80 shrink-0 select-none group-hover:scale-110 transition-transform"
                                        />
                                      ) : (
                                        <style.vectorIcon className="w-3.5 h-3.5 shrink-0" />
                                      )}
                                      <span
                                        className={`truncate ${ev.isCompleted ? "line-through opacity-70" : ""}`}
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

                                  {/* Duration Resize Controls bar */}
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-1 pt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <span className="flex items-center gap-0.5 text-[8px] font-mono text-zinc-400">
                                      <GripVertical className="w-2.5 h-2.5" /> Kéo / Chỉnh
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAdjustDuration(ev.id, -30);
                                        }}
                                        className="px-1 py-0.2 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold transition text-[8px]"
                                        title="Bớt 30 phút"
                                      >
                                        -30p
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAdjustDuration(ev.id, 30);
                                        }}
                                        className="px-1 py-0.2 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold transition text-[8px]"
                                        title="Thêm 30 phút"
                                      >
                                        +30p
                                      </button>
                                    </div>
                                  </div>
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
        </motion.div>
      )}
      </AnimatePresence>
      {/* Quick Event Popover Preview on Hover */}
      {hoveredEvent && (
        <div
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeaveEvent}
          style={{
            position: "fixed",
            top: hoveredEvent.y,
            left: hoveredEvent.x,
            zIndex: 60,
          }}
          className="w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-100 pointer-events-auto"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {uiTheme === "cute" ? (
                categoryStyles[hoveredEvent.event.category]?.iconImg && (
                  <img
                    src={categoryStyles[hoveredEvent.event.category].iconImg}
                    alt=""
                    className="w-7 h-7 rounded-xl object-cover shadow-xs border border-white/80 dark:border-zinc-700/80 shrink-0"
                  />
                )
              ) : (
                categoryStyles[hoveredEvent.event.category]?.vectorIcon && (
                  <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                    {React.createElement(categoryStyles[hoveredEvent.event.category].vectorIcon, { className: "w-4 h-4" })}
                  </div>
                )
              )}
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                {hoveredEvent.event.title}
              </h4>
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                categoryStyles[hoveredEvent.event.category]?.bg || "bg-zinc-100"
              } ${categoryStyles[hoveredEvent.event.category]?.text || "text-zinc-700"}`}
            >
              {hoveredEvent.event.category}
            </span>
          </div>

          {/* Time & Duration */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">
                {new Date(hoveredEvent.event.startTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(hoveredEvent.event.endTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-[10px] text-zinc-400 shrink-0">
                ({Math.round(
                  (new Date(hoveredEvent.event.endTime).getTime() -
                    new Date(hoveredEvent.event.startTime).getTime()) /
                    60000,
                )}p)
              </span>
            </div>

            {/* Quick +/- 30m buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleAdjustDuration(hoveredEvent.event.id, -30)}
                className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                title="Giảm 30 phút"
              >
                -30p
              </button>
              <button
                type="button"
                onClick={() => handleAdjustDuration(hoveredEvent.event.id, 30)}
                className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                title="Tăng 30 phút"
              >
                +30p
              </button>
            </div>
          </div>

          {/* Location if exists */}
          {hoveredEvent.event.location && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{hoveredEvent.event.location}</span>
            </div>
          )}

          {/* Description preview */}
          {hoveredEvent.event.description && (
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 bg-zinc-50 dark:bg-zinc-800/50 p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
              {hoveredEvent.event.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              {/* Pomodoro quick trigger */}
              {onOpenPomodoroForEvent && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPomodoroForEvent(hoveredEvent.event);
                    setHoveredEvent(null);
                  }}
                  className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Tập trung Pomodoro"
                >
                  <Play className="w-2.5 h-2.5 fill-amber-500" />
                  <span>Focus</span>
                </button>
              )}

              {/* Complete toggle */}
              <button
                type="button"
                onClick={() => {
                  onToggleComplete(hoveredEvent.event.id);
                  setHoveredEvent(null);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer border ${
                  hoveredEvent.event.isCompleted
                    ? "bg-zinc-100 text-zinc-500 border-zinc-200"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Check className="w-2.5 h-2.5" />
                <span>{hoveredEvent.event.isCompleted ? "Xong" : "Làm xong"}</span>
              </button>
            </div>

            {/* Edit / Details */}
            <button
              type="button"
              onClick={() => {
                onSelectEvent(hoveredEvent.event);
                setHoveredEvent(null);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-semibold transition cursor-pointer"
            >
              Chi tiết
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
