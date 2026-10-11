import React, { useState, useMemo } from "react";
import {
  X,
  BarChart3,
  Sparkles,
  TrendingUp,
  TrendingDown,
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
  Flame,
  Award,
  AlertCircle,
  Trash2,
  ListTodo,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { ScheduleItem, UserProfile } from "../types/schedule";
import {
  optimizeScheduleWithAI,
  OptimizationResult,
  getWeeklyRetrospectiveWithAI,
  WeeklyRetrospectiveResult,
} from "../services/aiService";
import {
  getMondayOfWeek,
  getSundayOfWeek,
  formatWeekRange,
  isEventInWeek,
  formatTimeShort,
  formatDateTimeShort,
} from "../utils/dateUtils";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleItem[];
  userProfile: UserProfile;
  currentDate?: Date;
  onUpdateEvents?: (updatedEvents: ScheduleItem[]) => void;
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
  onUpdateEvents,
  onApplyOptimizedEvents,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "retrospective">("overview");
  const [timeRange, setTimeRange] = useState<"week" | "all">("week");
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(
    () => currentDate || new Date()
  );
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<"all" | "changes_only">("changes_only");

  // Retrospective AI state
  const [isAnalyzingRetro, setIsAnalyzingRetro] = useState(false);
  const [retroResult, setRetroResult] = useState<WeeklyRetrospectiveResult | null>(null);
  const [retroError, setRetroError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Calculate current week range
  const monday = useMemo(() => getMondayOfWeek(selectedWeekDate), [selectedWeekDate]);
  const sunday = useMemo(() => getSundayOfWeek(monday), [monday]);
  const weekLabel = useMemo(() => formatWeekRange(monday, sunday), [monday, sunday]);

  const isCurrentWeek = useMemo(() => {
    const nowMonday = getMondayOfWeek(new Date());
    return nowMonday.getTime() === monday.getTime();
  }, [monday]);

  // Calculate previous week range
  const prevMonday = useMemo(
    () => new Date(monday.getTime() - 7 * 24 * 3600 * 1000),
    [monday]
  );
  const prevSunday = useMemo(() => {
    const s = new Date(prevMonday);
    s.setDate(prevMonday.getDate() + 6);
    s.setHours(23, 59, 59, 999);
    return s;
  }, [prevMonday]);
  const prevWeekLabel = useMemo(
    () => formatWeekRange(prevMonday, prevSunday),
    [prevMonday, prevSunday]
  );

  // Filter events based on timeRange
  const activeEvents = useMemo(() => {
    if (timeRange === "all") return events;
    return events.filter((ev) =>
      isEventInWeek(ev.startTime, ev.endTime, monday, sunday)
    );
  }, [events, timeRange, monday, sunday]);

  // Previous week events & backlog
  const prevWeekEvents = useMemo(() => {
    return events.filter((ev) =>
      isEventInWeek(ev.startTime, ev.endTime, prevMonday, prevSunday)
    );
  }, [events, prevMonday, prevSunday]);

  const prevCompletedEvents = useMemo(() => {
    return prevWeekEvents.filter((e) => e.isCompleted);
  }, [prevWeekEvents]);

  const prevUncompletedEvents = useMemo(() => {
    return prevWeekEvents.filter(
      (e) => !e.isCompleted && !e.isTravelBuffer && e.category !== "break"
    );
  }, [prevWeekEvents]);

  const prevRate = useMemo(() => {
    return prevWeekEvents.length > 0
      ? Math.round((prevCompletedEvents.length / prevWeekEvents.length) * 100)
      : 0;
  }, [prevWeekEvents, prevCompletedEvents]);

  const prevUncompletedHours = useMemo(() => {
    let mins = 0;
    prevUncompletedEvents.forEach((e) => {
      const diff = Math.max(
        0,
        Math.round(
          (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000
        )
      );
      mins += diff;
    });
    return (mins / 60).toFixed(1);
  }, [prevUncompletedEvents]);

  // Calculate current week stats
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

  const rateDiff = stats.rate - prevRate;

  // Compute AI changes diff when optimizationResult is available
  const computedDiffs = useMemo<ScheduleDiff[]>(() => {
    if (!optimizationResult || !optimizationResult.optimizedEvents) return [];

    const diffs: ScheduleDiff[] = [];
    const usedOrigIds = new Set<string>();

    optimizationResult.optimizedEvents.forEach((optItem, idx) => {
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

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 2800);
  };

  // Backlog Action: Rollover 1 event to current week (+7 days)
  const handleRolloverEvent = (event: ScheduleItem) => {
    if (!onUpdateEvents) return;
    const oldStart = new Date(event.startTime);
    const oldEnd = new Date(event.endTime);
    const newStart = new Date(oldStart.getTime() + 7 * 24 * 3600 * 1000);
    const newEnd = new Date(oldEnd.getTime() + 7 * 24 * 3600 * 1000);

    const updatedEvent: ScheduleItem = {
      ...event,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      isCompleted: false,
    };

    const newEvents = events.map((e) => (e.id === event.id ? updatedEvent : e));
    onUpdateEvents(newEvents);
    showToast(`Đã dời "${event.title}" sang tuần này!`);
  };

  // Backlog Action: Rollover ALL uncompleted events to current week
  const handleRolloverAll = () => {
    if (!onUpdateEvents || prevUncompletedEvents.length === 0) return;
    const uncompletedIds = new Set(prevUncompletedEvents.map((e) => e.id));

    const newEvents = events.map((e) => {
      if (uncompletedIds.has(e.id)) {
        const oldStart = new Date(e.startTime);
        const oldEnd = new Date(e.endTime);
        const newStart = new Date(oldStart.getTime() + 7 * 24 * 3600 * 1000);
        const newEnd = new Date(oldEnd.getTime() + 7 * 24 * 3600 * 1000);
        return {
          ...e,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          isCompleted: false,
        };
      }
      return e;
    });

    onUpdateEvents(newEvents);
    showToast(`Đã chuyển toàn bộ ${prevUncompletedEvents.length} việc tồn sang tuần này!`);
  };

  // Backlog Action: Mark completed
  const handleMarkCompleted = (event: ScheduleItem) => {
    if (!onUpdateEvents) return;
    const newEvents = events.map((e) =>
      e.id === event.id ? { ...e, isCompleted: true } : e
    );
    onUpdateEvents(newEvents);
    showToast(`Đã đánh dấu "${event.title}" hoàn thành!`);
  };

  // Backlog Action: Delete / Cancel event
  const handleDeleteEvent = (event: ScheduleItem) => {
    if (!onUpdateEvents) return;
    const newEvents = events.filter((e) => e.id !== event.id);
    onUpdateEvents(newEvents);
    showToast(`Đã hủy việc "${event.title}".`);
  };

  // AI Weekly Retrospective Trigger
  const handleRunRetrospectiveAI = async () => {
    setIsAnalyzingRetro(true);
    setRetroError(null);
    try {
      const res = await getWeeklyRetrospectiveWithAI(
        prevWeekLabel,
        prevWeekEvents,
        prevUncompletedEvents,
        prevRate,
        userProfile
      );
      setRetroResult(res);
    } catch (err: any) {
      setRetroError(err.message || "Lỗi khi AI phân tích tuần trước");
    } finally {
      setIsAnalyzingRetro(false);
    }
  };

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

  // Productivity Vibe Badge
  const getVibeBadge = (rate: number) => {
    if (rate >= 80) {
      return {
        label: "Phong Độ Xuất Sắc",
        icon: Flame,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60",
      };
    }
    if (rate >= 60) {
      return {
        label: "Cân Bằng Ổn Định",
        icon: ShieldCheck,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60",
      };
    }
    return {
      label: "Cần Giảm Tải & Thả Lỏng",
      icon: AlertCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60",
    };
  };

  const currentVibe = getVibeBadge(prevWeekEvents.length > 0 ? prevRate : stats.rate);

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
                Phân tích cân bằng môn học, nhìn lại tuần trước và tự động tối ưu lịch trình
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

        {/* Action notification toast */}
        {actionNotice && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Main Tabs Navigation */}
        <div className="px-5 pt-3 pb-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === "overview"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Phân Bổ & Năng Suất</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("retrospective")}
              className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === "retrospective"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Nhìn Lại Tuần Trước (Review)</span>
              {prevUncompletedEvents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                  {prevUncompletedEvents.length} việc tồn
                </span>
              )}
            </button>
          </div>

          {/* Week switcher (only for week mode) */}
          <div className="hidden sm:flex items-center gap-1 pb-2">
            <button
              onClick={() =>
                setSelectedWeekDate(
                  new Date(selectedWeekDate.getTime() - 7 * 24 * 3600 * 1000)
                )
              }
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 px-1.5">
              {weekLabel}
            </span>
            <button
              onClick={() =>
                setSelectedWeekDate(
                  new Date(selectedWeekDate.getTime() + 7 * 24 * 3600 * 1000)
                )
              }
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          {activeTab === "overview" && (
            <>
              {/* Filter bar: Tuần vs Tất cả */}
              <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
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

                {timeRange === "week" && (
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Đang xem: <strong>{weekLabel}</strong>
                    </span>
                    {!isCurrentWeek && (
                      <button
                        onClick={() => setSelectedWeekDate(new Date())}
                        className="px-2 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Về tuần này
                      </button>
                    )}
                  </div>
                )}
              </div>

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
                      <circle
                        cx="70"
                        cy="70"
                        r={donutRadius}
                        className="stroke-zinc-200 dark:stroke-zinc-700/60"
                        strokeWidth="16"
                        fill="transparent"
                      />

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

                {optimizationResult && (
                  <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 space-y-4 animate-in fade-in">
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

                    {/* Detailed changes breakdown */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Chi tiết thay đổi lịch trình ({computedDiffs.length} sự kiện):
                        </span>

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
            </>
          )}

          {/* TAB 2: RETROSPECTIVE & UNCOMPLETED BACKLOG REVIEW */}
          {activeTab === "retrospective" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Scoreboard: Tuần trước vs Tuần này */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Tuần trước ({prevWeekLabel})
                  </span>
                  <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                    {prevRate}%
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Đạt {prevCompletedEvents.length}/{prevWeekEvents.length} việc
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60">
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                    Tuần này ({weekLabel})
                  </span>
                  <div className="text-xl font-black text-purple-950 dark:text-purple-100 mt-1">
                    {stats.rate}%
                  </div>
                  <span className="text-[10px] text-purple-500/80">
                    Đạt {stats.completed}/{activeEvents.length} việc
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Tăng trưởng tỷ lệ
                  </span>
                  <div className="text-xl font-black mt-1 flex items-center gap-1.5">
                    {rateDiff > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-1" />+{rateDiff}%
                      </span>
                    ) : rateDiff < 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center">
                        <TrendingDown className="w-5 h-5 mr-1" />{rateDiff}%
                      </span>
                    ) : (
                      <span className="text-zinc-600 dark:text-zinc-300">0%</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {rateDiff > 0 ? "Tiến bộ hơn tuần trước" : rateDiff < 0 ? "Cần tập trung bứt phá" : "Giữ vững phong độ"}
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${currentVibe.bg}`}>
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    Huy hiệu phong độ
                  </span>
                  <div className={`text-base font-black mt-1 flex items-center gap-1.5 ${currentVibe.color}`}>
                    <currentVibe.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{currentVibe.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {prevUncompletedEvents.length > 0 ? `${prevUncompletedEvents.length} việc tồn (${prevUncompletedHours}h)` : "Không nợ việc"}
                  </span>
                </div>
              </div>

              {/* Gemini AI Retrospective Coaching Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-purple-50/50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-zinc-900 border border-amber-200/80 dark:border-amber-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-amber-900 dark:text-amber-200">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Gemini AI Weekly Retrospective (Khai vấn tuần trước)</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Phân tích nguyên nhân việc tồn đọng và gợi ý giải pháp dứt điểm nhẹ nhàng
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunRetrospectiveAI}
                    disabled={isAnalyzingRetro}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {isAnalyzingRetro ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isAnalyzingRetro ? "Đang đánh giá..." : "AI Đánh Giá Tuần Trước"}</span>
                  </button>
                </div>

                {retroError && (
                  <div className="text-xs text-rose-600 dark:text-rose-400">
                    {retroError}
                  </div>
                )}

                {retroResult && (
                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 space-y-2.5 animate-in fade-in">
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed bg-white/70 dark:bg-zinc-800/60 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                      💬 {retroResult.summary}
                    </div>

                    {retroResult.actionableAdvice?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          Gợi ý xử lý việc tồn tuần này:
                        </span>
                        <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
                          {retroResult.actionableAdvice.map((adv, idx) => (
                            <li key={idx}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Uncompleted Backlog Cards Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4 text-purple-600" />
                      Công Việc Chưa Hoàn Thành Tuần Trước ({prevUncompletedEvents.length})
                    </h4>
                    <span className="text-xs text-zinc-400">
                      • {prevUncompletedHours} giờ chưa dứt điểm
                    </span>
                  </div>

                  {prevUncompletedEvents.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRolloverAll}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Dời tất cả sang tuần này (+7 ngày)</span>
                    </button>
                  )}
                </div>

                {prevUncompletedEvents.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Không có công việc nào bị tồn đọng!
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                      Tuần trước ({prevWeekLabel}) bạn đã giải quyết trọn vẹn toàn bộ các mục tiêu hoặc không có việc chưa xong. Thật xuất sắc!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {prevUncompletedEvents.map((ev) => {
                      const catConf = CATEGORY_CONFIG[ev.category] || CATEGORY_CONFIG.personal;
                      const durationMins = Math.max(
                        0,
                        Math.round(
                          (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / 60000
                        )
                      );
                      const durStr = durationMins >= 60 ? `${(durationMins / 60).toFixed(1)}h` : `${durationMins}p`;

                      return (
                        <div
                          key={ev.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-purple-300 dark:hover:border-purple-800"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                                {ev.title}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${catConf.bgClass} ${catConf.textClass}`}
                              >
                                {catConf.label}
                              </span>
                              {ev.priority === "high" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  Ưu tiên cao
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{formatDateTimeShort(ev.startTime)} - {formatTimeShort(ev.endTime)} ({durStr})</span>
                            </div>

                            {ev.description && (
                              <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleRolloverEvent(ev)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-purple-200/60 dark:border-purple-800"
                              title="Dời công việc này sang cùng thứ trong tuần này (+7 ngày)"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Dời sang tuần này</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkCompleted(ev)}
                              className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition cursor-pointer border border-emerald-200/60 dark:border-emerald-800"
                              title="Đánh dấu đã hoàn thành"
                            >
                              <Check className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev)}
                              className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 text-zinc-400 transition cursor-pointer"
                              title="Hủy / Xóa việc này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
