import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  Play,
  ExternalLink,
  BookOpen,
  Briefcase,
  Users,
  Coffee,
  Heart,
  Navigation,
  X,
  Sparkles,
} from "lucide-react";
import { ScheduleItem, UiTheme } from "../types/schedule";
import {
  getMondayOfWeek,
  getSundayOfWeek,
  isEventInWeek,
  formatWeekRange,
} from "../utils/dateUtils";
import { getThemeCategoryIcon } from "../utils/themeIcons";

interface TodayWidgetProps {
  events: ScheduleItem[];
  onSelectEvent: (event: ScheduleItem) => void;
  onOpenPomodoroForEvent: (event: ScheduleItem) => void;
  onToggleComplete: (eventId: string) => void;
  onOpenReschedule?: (eventId?: string) => void;
  onOpenTravelBuffer?: () => void;
  uiTheme?: UiTheme;
  tasksCount?: number;
  onOpenTasks?: () => void;
  onOpenSheets?: () => void;
  onOpenGmail?: () => void;
  onCloseWidget?: () => void;
}

export const TodayWidget: React.FC<TodayWidgetProps> = ({
  events,
  onSelectEvent,
  onOpenPomodoroForEvent,
  onToggleComplete,
  onOpenReschedule,
  onOpenTravelBuffer,
  uiTheme = "cute",
  tasksCount = 0,
  onOpenTasks,
  onOpenSheets,
  onOpenGmail,
  onCloseWidget,
}) => {
  const [viewScope, setViewScope] = useState<"today" | "week">("today");

  const getCategoryVectorIcon = (category: string) => {
    switch (category) {
      case "study": return BookOpen;
      case "work": return Briefcase;
      case "meeting": return Users;
      case "break": return Coffee;
      case "personal": return Heart;
      default: return Calendar;
    }
  };

  const today = new Date();
  const localDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = localDateStr(today);

  const monday = getMondayOfWeek(today);
  const sunday = getSundayOfWeek(monday);

  const displayEvents = React.useMemo(() => {
    let filtered = events;
    if (viewScope === "today") {
      filtered = filtered.filter((e) => localDateStr(new Date(e.startTime)) === todayStr);
    } else {
      filtered = filtered.filter((e) => isEventInWeek(e.startTime, e.endTime, monday, sunday));
    }
    return filtered.slice().sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [events, viewScope, todayStr, monday, sunday]);

  const completedCount = displayEvents.filter((e) => e.isCompleted).length;
  const progressPercent =
    displayEvents.length > 0
      ? Math.round((completedCount / displayEvents.length) * 100)
      : 0;

  const handleCheckTask = (eventId: string, currentCompleted?: boolean) => {
    onToggleComplete(eventId);
    if (!currentCompleted && completedCount + 1 === displayEvents.length) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });
    }
  };

  // Find next upcoming event
  const nowTime = today.getTime();
  const nextEvent = displayEvents.find(
    (e) => new Date(e.endTime).getTime() > nowTime,
  );

  return (
    <div className={`bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl ${uiTheme === "cute" ? "rounded-3xl" : "rounded-2xl"} p-3.5 shadow-sm border border-zinc-200/80 dark:border-zinc-800 transition-all flex flex-col gap-2.5`}>
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base select-none">🗓️</span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {viewScope === "today" ? "Hôm nay" : "Tuần này"}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium truncate">
            {viewScope === "today"
              ? today.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })
              : formatWeekRange(monday, sunday)}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Segmented Pill */}
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setViewScope("today")}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                viewScope === "today"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Ngày
            </button>
            <button
              type="button"
              onClick={() => setViewScope("week")}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                viewScope === "week"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Tuần
            </button>
          </div>

          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 border border-pink-200/80 dark:border-pink-800/80">
            {displayEvents.length} việc
          </span>

          {onCloseWidget && (
            <button
              type="button"
              onClick={onCloseWidget}
              title="Ẩn widget"
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Slim Inline Progress Bar */}
      {displayEvents.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
              <span>⭐</span> Tiến độ
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {completedCount}/{displayEvents.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Compact Next Focus Card */}
      {nextEvent ? (
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {uiTheme !== "default" ? (
              <img
                src={getThemeCategoryIcon(nextEvent.category, uiTheme)}
                alt=""
                className="w-6 h-6 rounded-lg object-contain bg-white/70 dark:bg-zinc-800/70 p-0.5 shadow-2xs border border-white/80 dark:border-zinc-700/80 shrink-0 select-none"
              />
            ) : (
              <div className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                {React.createElement(getCategoryVectorIcon(nextEvent.category), { className: "w-3.5 h-3.5" })}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 leading-none">
                <span>Tiếp theo:</span>
                <span>
                  {new Date(nextEvent.startTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                {nextEvent.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onOpenPomodoroForEvent(nextEvent)}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
              title="Bật Pomodoro"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Pomodoro</span>
            </button>
            {nextEvent.hasMeet && (
              <a
                href={nextEvent.meetLink || "https://meet.google.com/new"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                title="Google Meet"
              >
                <Video className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ) : displayEvents.length > 0 && completedCount === displayEvents.length ? (
        <div className="py-2 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
          <span>🎉</span>
          <span>Đã hoàn thành 100% mục tiêu!</span>
        </div>
      ) : null}

      {/* Task List (Clean & Compact) */}
      <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5 no-scrollbar">
        {displayEvents.length === 0 ? (
          <div className="text-center py-4 text-xs text-zinc-400">
            Chưa có công việc trong {viewScope === "today" ? "ngày" : "tuần"} này
          </div>
        ) : (
          displayEvents.map((ev) => {
            const start = new Date(ev.startTime);

            if (ev.isTravelBuffer) {
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="p-1.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 text-[11px] flex items-center justify-between gap-1.5 transition hover:bg-amber-100/70 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {uiTheme !== "default" ? (
                      <img
                        src={getThemeCategoryIcon("travel", uiTheme)}
                        alt="travel"
                        className="w-4 h-4 rounded-md object-contain bg-white/70 dark:bg-zinc-800/70 p-0.5 shrink-0"
                      />
                    ) : (
                      <Navigation className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold text-amber-950 dark:text-amber-100 truncate">
                      {ev.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
                    {ev.bufferMinutes || 25}p
                  </span>
                </div>
              );
            }

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className={`p-1.5 px-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer ${
                  ev.isCompleted
                    ? "border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/40 dark:bg-zinc-800/10 opacity-55"
                    : "border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckTask(ev.id, ev.isCompleted);
                    }}
                    className={`shrink-0 transition-transform active:scale-75 ${
                      ev.isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-400 hover:text-emerald-500"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  {uiTheme !== "default" ? (
                    <img
                      src={getThemeCategoryIcon(ev.category, uiTheme)}
                      alt=""
                      className="w-4 h-4 rounded-md object-contain bg-white/70 dark:bg-zinc-800/70 p-0.5 shrink-0"
                    />
                  ) : (
                    <div className="p-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                      {React.createElement(getCategoryVectorIcon(ev.category), { className: "w-3 h-3" })}
                    </div>
                  )}
                  <span
                    className={`font-medium truncate ${
                      ev.isCompleted
                        ? "line-through text-zinc-400"
                        : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {ev.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-[10px] text-zinc-400">
                  <span>
                    {start.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {ev.hasMeet && <Video className="w-2.5 h-2.5 text-emerald-500" />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Integrated Google Workspace Footer Strip */}
      {(onOpenTasks || onOpenSheets || onOpenGmail) && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
          {onOpenTasks && (
            <button
              type="button"
              onClick={onOpenTasks}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <span>📋 Tasks ({tasksCount})</span>
            </button>
          )}
          <span>•</span>
          {onOpenSheets && (
            <button
              type="button"
              onClick={onOpenSheets}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <span>📊 Sheets</span>
            </button>
          )}
          <span>•</span>
          {onOpenGmail && (
            <button
              type="button"
              onClick={onOpenGmail}
              className="hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <span>✉️ Gmail</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
