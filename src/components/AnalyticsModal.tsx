import React, { useState, useMemo } from "react";
import {
  X,
  BarChart3,
  Sparkles,
  TrendingUp,
  Clock,
  Coffee,
  CheckCircle2,
  Loader2,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Check,
  CalendarDays,
  Filter,
} from "lucide-react";
import { ScheduleItem, UserProfile } from "../types/schedule";
import {
  optimizeScheduleWithAI,
  OptimizationResult,
} from "../services/aiService";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleItem[];
  userProfile: UserProfile;
  currentDate?: Date;
  onApplyOptimizedEvents: (optimized: ScheduleItem[]) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; hex: string; bgClass: string; textClass: string }
> = {
  study: {
    label: "Học tập",
    color: "bg-blue-500",
    hex: "#3b82f6",
    bgClass: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  work: {
    label: "Công việc",
    color: "bg-indigo-500",
    hex: "#6366f1",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60",
    textClass: "text-indigo-600 dark:text-indigo-400",
  },
  meeting: {
    label: "Cuộc họp",
    color: "bg-emerald-500",
    hex: "#10b981",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  break: {
    label: "Nghỉ ngơi",
    color: "bg-amber-400",
    hex: "#f59e0b",
    bgClass: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  personal: {
    label: "Cá nhân",
    color: "bg-purple-500",
    hex: "#a855f7",
    bgClass: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60",
    textClass: "text-purple-600 dark:text-purple-400",
  },
};

const getMondayOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday, 1 = Monday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getSundayOfWeek = (monday: Date): Date => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

const formatTimeShort = (isoString?: string) => {
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

const formatDateTimeShort = (isoString?: string) => {
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

interface ScheduleDiff {
  type: "rescheduled" | "break_added" | "new_added" | "unchanged";
  matchedId?: string;
  title: string;
  category: string;
  oldStart?: string;
  oldEnd?: string;
  newStart: string;
  newEnd: string;
  reason?: string;
  optimizedItem: any;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  events,
  userProfile,
  currentDate,
  onApplyOptimizedEvents,
}) => {
  const [timeRange, setTimeRange] = useState<"week" | "all">("week");
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(
    () => currentDate || new Date()
  );
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<"all" | "changes_only">("changes_only");

  // Calculate current week range
  const monday = useMemo(() => getMondayOfWeek(selectedWeekDate), [selectedWeekDate]);
  const sunday = useMemo(() => getSundayOfWeek(monday), [monday]);

  const weekLabel = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const mStr = `${pad(monday.getDate())}/${pad(monday.getMonth() + 1)}`;
    const sStr = `${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}/${sunday.getFullYear()}`;
    return `${mStr} - ${sStr}`;
  }, [monday, sunday]);

  const isCurrentWeek = useMemo(() => {
    const nowMonday = getMondayOfWeek(new Date());
    return nowMonday.getTime() === monday.getTime();
  }, [monday]);

  // Filter events based on timeRange
  const activeEvents = useMemo(() => {
    if (timeRange === "all") return events;
    const mTime = monday.getTime();
    const sTime = sunday.getTime();
    return events.filter((ev) => {
      const start = new Date(ev.startTime).getTime();
      const end = new Date(ev.endTime).getTime();
      return start <= sTime && end >= mTime;
    });
  }, [events, timeRange, monday, sunday]);

  // Calculate stats on activeEvents
  const stats = useMemo(() => {
    let totalMins = 0;
    const catMins: Record<string, number> = {
      study: 0,
      work: 0,
      meeting: 0,
      break: 0,
      personal: 0,
    };

    activeEvents.forEach((ev) => {
      const s = new Date(ev.startTime).getTime();
      const e = new Date(ev.endTime).getTime();
      const diffMins = Math.max(0, Math.round((e - s) / (1000 * 60)));
      totalMins += diffMins;
      if (catMins[ev.category] !== undefined) {
        catMins[ev.category] += diffMins;
      } else {
        catMins.personal += diffMins;
      }
    });

    const completed = activeEvents.filter((e) => e.isCompleted).length;
    const rate =
      activeEvents.length > 0
        ? Math.round((completed / activeEvents.length) * 100)
        : 0;

    return {
      totalMins,
      totalHours: (totalMins / 60).toFixed(1),
      catMins,
      completed,
      rate,
    };
  }, [activeEvents]);

  // Compute AI changes diff when optimizationResult is available
  const computedDiffs = useMemo<ScheduleDiff[]>(() => {
    if (!optimizationResult || !optimizationResult.optimizedEvents) return [];

    const diffs: ScheduleDiff[] = [];
    const usedOrigIds = new Set<string>();

    optimizationResult.optimizedEvents.forEach((optItem, idx) => {
      // 1. Try matching with original event in activeEvents
      let matchedOrig = activeEvents.find(
        (orig) =>
          ((optItem as any).id && orig.id === (optItem as any).id) ||
          (!usedOrigIds.has(orig.id) &&
            orig.title.trim().toLowerCase() === optItem.title.trim().toLowerCase())
      );

      if (matchedOrig) {
        usedOrigIds.add(matchedOrig.id);
        const oldStart = matchedOrig.startTime;
        const oldEnd = matchedOrig.endTime;
        const isTimeShifted =
          new Date(oldStart).getTime() !== new Date(optItem.startTime).getTime() ||
          new Date(oldEnd).getTime() !== new Date(optItem.endTime).getTime();

        if (isTimeShifted) {
          diffs.push({
            type: "rescheduled",
            matchedId: matchedOrig.id,
            title: optItem.title,
            category: optItem.category,
            oldStart,
            oldEnd,
            newStart: optItem.startTime,
            newEnd: optItem.endTime,
            reason:
              optItem.changeReason ||
              "Dời thời gian để cân bằng năng lượng và tránh kiệt sức",
            optimizedItem: { ...optItem, id: matchedOrig.id },
          });
        } else {
          diffs.push({
            type: "unchanged",
            matchedId: matchedOrig.id,
            title: optItem.title,
            category: optItem.category,
            oldStart,
            oldEnd,
            newStart: optItem.startTime,
            newEnd: optItem.endTime,
            reason: optItem.changeReason || "Khung giờ đã tối ưu, giữ nguyên",
            optimizedItem: { ...optItem, id: matchedOrig.id },
          });
        }
      } else {
        // Not matched: New event or break
        const isBreak =
          optItem.isBreak ||
          optItem.category === "break" ||
          optItem.title.toLowerCase().includes("nghỉ") ||
          optItem.title.toLowerCase().includes("break") ||
          optItem.title.toLowerCase().includes("pomodoro");

        const generatedId = (optItem as any).id || `opt-${Date.now()}-${idx}`;

        diffs.push({
          type: isBreak ? "break_added" : "new_added",
          title: optItem.title,
          category: optItem.category,
          newStart: optItem.startTime,
          newEnd: optItem.endTime,
          reason:
            optItem.changeReason ||
            (isBreak
              ? "Tự động chèn khoảng nghỉ Pomodoro để tái tạo năng lượng"
              : "Thêm sự kiện mới được đề xuất"),
          optimizedItem: { ...optItem, id: generatedId },
        });
      }
    });

    return diffs;
  }, [optimizationResult, activeEvents]);

  const diffCounts = useMemo(() => {
    let rescheduled = 0;
    let breaks = 0;
    let newEvents = 0;
    let unchanged = 0;
    computedDiffs.forEach((d) => {
      if (d.type === "rescheduled") rescheduled++;
      else if (d.type === "break_added") breaks++;
      else if (d.type === "new_added") newEvents++;
      else if (d.type === "unchanged") unchanged++;
    });
    return {
      rescheduled,
      breaks,
      newEvents,
      unchanged,
      totalChanges: rescheduled + breaks + newEvents,
    };
  }, [computedDiffs]);

  if (!isOpen) return null;

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    setErrorMsg(null);
    try {
      const res = await optimizeScheduleWithAI(activeEvents, userProfile);
      setOptimizationResult(res);
    } catch (e: any) {
      setErrorMsg(e.message || "Lỗi khi tối ưu hóa lịch trình");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApply = () => {
    if (!optimizationResult || computedDiffs.length === 0) return;

    const newItems: ScheduleItem[] = computedDiffs.map((diff, idx) => ({
      id: diff.optimizedItem.id || `opt-${Date.now()}-${idx}`,
      title: diff.optimizedItem.title,
      description: diff.optimizedItem.description || "",
      startTime: diff.optimizedItem.startTime,
      endTime: diff.optimizedItem.endTime,
      category: diff.optimizedItem.category,
      priority: diff.optimizedItem.priority,
      hasMeet: diff.optimizedItem.hasMeet ?? false,
      source: "ai" as const,
      isSyncedToGoogle: false,
    }));

    onApplyOptimizedEvents(newItems);
    onClose();
  };

  // Donut chart calculations
  const donutRadius = 50;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~314.159
  let accumulatedOffset = 0;

  const categoriesList = ["study", "work", "meeting", "break", "personal"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Thống Kê Năng Suất & Tối Ưu Lịch Trình
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Phân tích cân bằng môn học và tự động điều chỉnh khoảng nghỉ thông minh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar: Tuần vs Tất cả */}
        <div className="px-5 py-3 bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Switch: Theo tuần / Tất cả */}
          <div className="flex items-center p-1 bg-zinc-200/60 dark:bg-zinc-800 rounded-xl">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                timeRange === "week"
                  ? "bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-300 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo tuần</span>
            </button>
            <button
              onClick={() => setTimeRange("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                timeRange === "all"
                  ? "bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-300 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tất cả sự kiện</span>
            </button>
          </div>

          {/* Week navigation (only when timeRange === 'week') */}
          {timeRange === "week" && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setSelectedWeekDate(
                    new Date(selectedWeekDate.getTime() - 7 * 24 * 3600 * 1000)
                  )
                }
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs">
                <CalendarDays className="w-3.5 h-3.5 text-purple-500" />
                <span>{weekLabel}</span>
              </div>
              <button
                onClick={() =>
                  setSelectedWeekDate(
                    new Date(selectedWeekDate.getTime() + 7 * 24 * 3600 * 1000)
                  )
                }
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Tuần sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={() => setSelectedWeekDate(new Date())}
                  className="px-2 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer ml-1"
                >
                  Tuần này
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-500">
                Tổng thời gian
              </span>
              <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                {stats.totalHours}h
              </div>
              <span className="text-[10px] text-zinc-400">
                {activeEvents.length} sự kiện {timeRange === "week" ? "trong tuần" : ""}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Học tập
              </span>
              <div className="text-xl font-black text-blue-950 dark:text-blue-100 mt-0.5">
                {(stats.catMins.study / 60).toFixed(1)}h
              </div>
              <span className="text-[10px] text-blue-500/80">Deep Work</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Họp & Meet
              </span>
              <div className="text-xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
                {(stats.catMins.meeting / 60).toFixed(1)}h
              </div>
              <span className="text-[10px] text-emerald-500/80">Giao tiếp</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Nghỉ ngơi
              </span>
              <div className="text-xl font-black text-amber-950 dark:text-amber-100 mt-0.5">
                {(stats.catMins.break / 60).toFixed(1)}h
              </div>
              <span className="text-[10px] text-amber-500/80">Tái tạo năng lượng</span>
            </div>
          </div>

          {/* Biểu đồ tròn (Donut Chart) & Phân bổ chi tiết */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Biểu Đồ Phân Bổ Thời Gian
                </h4>
              </div>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Tỷ lệ hoàn thành:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.rate}%
                </span>{" "}
                ({stats.completed}/{activeEvents.length})
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-around pt-1">
              {/* SVG Donut Chart */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 origin-center" viewBox="0 0 140 140">
                  {/* Background track */}
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    className="stroke-zinc-200 dark:stroke-zinc-700/60"
                    strokeWidth="16"
                    fill="transparent"
                  />

                  {/* Slices */}
                  {stats.totalMins > 0 ? (
                    categoriesList.map((catKey) => {
                      const mins = stats.catMins[catKey] || 0;
                      if (mins <= 0) return null;
                      const pct = mins / stats.totalMins;
                      const sliceLen = pct * donutCircumference;
                      const currentOffset = accumulatedOffset;
                      accumulatedOffset += sliceLen;

                      return (
                        <circle
                          key={catKey}
                          cx="70"
                          cy="70"
                          r={donutRadius}
                          stroke={CATEGORY_CONFIG[catKey]?.hex || "#94a3b8"}
                          strokeWidth="16"
                          strokeDasharray={`${sliceLen} ${donutCircumference - sliceLen}`}
                          strokeDashoffset={-currentOffset}
                          fill="transparent"
                          className="transition-all duration-500"
                        />
                      );
                    })
                  ) : (
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      className="stroke-zinc-300 dark:stroke-zinc-600"
                      strokeWidth="16"
                      fill="transparent"
                    />
                  )}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                    {stats.totalHours}h
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400">
                    {timeRange === "week" ? "Tuần này" : "Tổng cộng"}
                  </span>
                </div>
              </div>

              {/* Legend & Breakdown Bars */}
              <div className="flex-1 w-full space-y-2.5">
                {categoriesList.map((catKey) => {
                  const conf = CATEGORY_CONFIG[catKey];
                  const mins = stats.catMins[catKey] || 0;
                  const hours = (mins / 60).toFixed(1);
                  const pct =
                    stats.totalMins > 0
                      ? Math.round((mins / stats.totalMins) * 100)
                      : 0;

                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: conf.hex }}
                          />
                          <span>{conf.label}</span>
                        </span>
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {hours}h
                          </span>
                          <span>({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-700/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: conf.hex,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Auto-Balance Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-zinc-900 border border-indigo-200/80 dark:border-indigo-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Gemini AI Auto-balance & Tối ưu giờ nghỉ</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Phân tích lịch {timeRange === "week" ? "trong tuần được chọn" : "tất cả sự kiện"}, rà soát quá tải và tự động chèn khoảng nghỉ Pomodoro
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunOptimizer}
                disabled={isOptimizing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isOptimizing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                <span>
                  {isOptimizing ? "Đang phân tích..." : "Phân tích & Tối ưu"}
                </span>
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                {errorMsg}
              </div>
            )}

            {/* Optimization Result & Changes Diff Breakdown */}
            {optimizationResult && (
              <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 space-y-4 animate-in fade-in">
                {/* Score & Explanation */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-3 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-indigo-100 dark:border-indigo-900/60">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">
                      Điểm Năng Suất
                    </span>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-300">
                      {optimizationResult.productivityScore}/100
                    </div>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {optimizationResult.scoreExplanation}
                  </p>
                </div>

                {/* Suggestions */}
                {optimizationResult.suggestions?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Khuyến nghị cải thiện:
                    </span>
                    <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
                      {optimizationResult.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* DETAILED CHANGES BREAKDOWN */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Chi tiết thay đổi lịch trình ({computedDiffs.length} sự kiện):
                    </span>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 bg-white/80 dark:bg-zinc-800/80 p-1 rounded-lg border border-indigo-100 dark:border-indigo-900 text-[11px]">
                      <button
                        onClick={() => setDiffFilter("changes_only")}
                        className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                          diffFilter === "changes_only"
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        Chỉ mục thay đổi ({diffCounts.totalChanges})
                      </button>
                      <button
                        onClick={() => setDiffFilter("all")}
                        className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                          diffFilter === "all"
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        Tất cả ({computedDiffs.length})
                      </button>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      {diffCounts.rescheduled} dời giờ
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Coffee className="w-3 h-3" />
                      {diffCounts.breaks} khoảng nghỉ mới
                    </span>
                    {diffCounts.newEvents > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" />
                        {diffCounts.newEvents} sự kiện mới
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {diffCounts.unchanged} giữ nguyên
                    </span>
                  </div>

                  {/* Scrollable list of cards */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {computedDiffs
                      .filter((diff) =>
                        diffFilter === "changes_only"
                          ? diff.type !== "unchanged"
                          : true
                      )
                      .map((diff, idx) => {
                        const isRescheduled = diff.type === "rescheduled";
                        const isBreak = diff.type === "break_added";
                        const isNew = diff.type === "new_added";

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                              isRescheduled
                                ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60"
                                : isBreak
                                ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                                : isNew
                                ? "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60"
                                : "bg-white/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                                {isRescheduled && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                    Dời giờ
                                  </span>
                                )}
                                {isBreak && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-1">
                                    <Coffee className="w-2.5 h-2.5" /> Thêm giờ nghỉ
                                  </span>
                                )}
                                {isNew && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                                    Mới
                                  </span>
                                )}
                                {!isRescheduled && !isBreak && !isNew && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                    Giữ nguyên
                                  </span>
                                )}
                                <span>{diff.title}</span>
                              </div>

                              <span className="text-[10px] uppercase font-bold text-zinc-400">
                                {CATEGORY_CONFIG[diff.category]?.label || diff.category}
                              </span>
                            </div>

                            {/* Time comparison */}
                            <div className="flex items-center flex-wrap gap-2 text-zinc-600 dark:text-zinc-300">
                              {isRescheduled && diff.oldStart && diff.oldEnd ? (
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="line-through text-zinc-400">
                                    {formatDateTimeShort(diff.oldStart)} - {formatTimeShort(diff.oldEnd)}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-blue-500 shrink-0" />
                                  <span className="font-bold text-blue-700 dark:text-blue-300">
                                    {formatDateTimeShort(diff.newStart)} - {formatTimeShort(diff.newEnd)}
                                  </span>
                                </div>
                              ) : (
                                <div className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
                                  {formatDateTimeShort(diff.newStart)} - {formatTimeShort(diff.newEnd)}
                                </div>
                              )}
                            </div>

                            {/* Lý do thay đổi */}
                            {diff.reason && (
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                                💡 {diff.reason}
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {diffFilter === "changes_only" && diffCounts.totalChanges === 0 && (
                      <div className="text-center py-4 text-xs text-zinc-500">
                        🎉 Lịch trình hiện tại đã phân bổ rất hợp lý, không có sự kiện nào cần dời giờ!
                      </div>
                    )}
                  </div>
                </div>

                {/* Apply button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Áp dụng lịch trình đã tối ưu ({optimizationResult.optimizedEvents.length} sự kiện)
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
