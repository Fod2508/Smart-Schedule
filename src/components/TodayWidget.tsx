import React from "react";
import confetti from "canvas-confetti";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  Play,
  ExternalLink,
  Sparkles,
  FastForward,
  Car,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Users,
  Coffee,
  Heart,
  Navigation,
} from "lucide-react";
import { ScheduleItem, UiTheme } from "../types/schedule";

interface TodayWidgetProps {
  events: ScheduleItem[];
  onSelectEvent: (event: ScheduleItem) => void;
  onOpenPomodoroForEvent: (event: ScheduleItem) => void;
  onToggleComplete: (eventId: string) => void;
  onOpenReschedule?: (eventId?: string) => void;
  onOpenTravelBuffer?: () => void;
  onLoadSampleSchedule?: () => void;
  uiTheme?: UiTheme;
}

export const TodayWidget: React.FC<TodayWidgetProps> = ({
  events,
  onSelectEvent,
  onOpenPomodoroForEvent,
  onToggleComplete,
  onOpenReschedule,
  onOpenTravelBuffer,
  onLoadSampleSchedule,
  uiTheme = "cute",
}) => {
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

  const todayEvents = events
    .filter((e) => {
      const d = new Date(e.startTime);
      return localDateStr(d) === todayStr;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  const completedCount = todayEvents.filter((e) => e.isCompleted).length;
  const progressPercent =
    todayEvents.length > 0
      ? Math.round((completedCount / todayEvents.length) * 100)
      : 0;

  const handleCheckTask = (eventId: string, currentCompleted?: boolean) => {
    onToggleComplete(eventId);
    // Nếu hoàn thành nhiệm vụ và sắp đạt 100%
    if (!currentCompleted && completedCount + 1 === todayEvents.length) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });
    }
  };

  // Find next upcoming event
  const nowTime = today.getTime();
  const nextEvent = todayEvents.find(
    (e) => new Date(e.endTime).getTime() > nowTime,
  );

  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-zinc-200/80 dark:border-zinc-800 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <span className="text-base select-none">🗓️</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <span>Lịch hôm nay</span>
              <span className="text-xs font-normal text-zinc-400">
                ({today.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })})
              </span>
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 border border-pink-200/80 dark:border-pink-800/80">
            {todayEvents.length} việc 🌸
          </span>
        </div>

        {/* Progress Bar with Shimmer Flow Wave */}
        {todayEvents.length > 0 && (
          <div className="mt-3 bg-zinc-50/80 dark:bg-zinc-800/40 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                <span>⭐</span> Tiến độ hoàn thành
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {completedCount}/{todayEvents.length} việc ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-200/70 dark:bg-zinc-700/60 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-pink-400 via-purple-400 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500 shimmer-flow shadow-sm shadow-indigo-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Current / Next Focus Card */}
        {nextEvent ? (
          <div className="mt-3 p-3.5 rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              <span className="flex items-center gap-1">
                <span className="animate-star-twinkle">✨</span> Việc tiếp theo cần chú ý
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950 font-bold">
                {new Date(nextEvent.startTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-1.5 truncate flex items-center gap-2">
              {uiTheme === "cute" ? (
                <img
                  src={
                    nextEvent.category === "study"
                      ? "/illustrations/badge_study.jpg"
                      : nextEvent.category === "work"
                        ? "/illustrations/badge_work.jpg"
                        : nextEvent.category === "meeting"
                          ? "/illustrations/badge_meeting.jpg"
                          : nextEvent.category === "break"
                            ? "/illustrations/badge_break.jpg"
                            : "/illustrations/badge_personal.jpg"
                  }
                  alt=""
                  className="w-7 h-7 rounded-xl object-cover shadow-2xs border border-white/80 dark:border-zinc-700/80 shrink-0"
                />
              ) : (
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                  {React.createElement(getCategoryVectorIcon(nextEvent.category), { className: "w-4 h-4" })}
                </div>
              )}
              <span className="truncate">{nextEvent.title}</span>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <button
                onClick={() => onOpenPomodoroForEvent(nextEvent)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition btn-chubby-primary cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Bật Pomodoro ⏱️</span>
              </button>

              {nextEvent.hasMeet && (
                <a
                  href={nextEvent.meetLink || "https://meet.google.com/new"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition btn-chubby-emerald"
                >
                  <Video className="w-3 h-3" />
                  <span>Google Meet</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 p-4 rounded-3xl bg-gradient-to-br from-pink-50/70 via-purple-50/50 to-indigo-50/60 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-indigo-950/30 border border-pink-200/60 dark:border-pink-900/40 text-center text-xs space-y-2">
            <div className="flex justify-center">
              {uiTheme === "yohan" ? (
                todayEvents.length > 0 && completedCount === todayEvents.length ? (
                  <img
                    src="/illustrations/yohan/yohan_cheering.png"
                    alt="Go Yohan Cheering"
                    className="w-24 h-24 object-contain drop-shadow-md animate-peek-bounce select-none"
                  />
                ) : (
                  <img
                    src="/illustrations/yohan/yohan_waving.png"
                    alt="Go Yohan Waving"
                    className="w-24 h-24 object-contain drop-shadow-md animate-float-bob select-none"
                  />
                )
              ) : uiTheme === "capybara" ? (
                <img
                  src="/illustrations/capybara_bath.png"
                  alt="Capybara Relax"
                  className="w-24 h-24 object-contain drop-shadow-md animate-float-bob select-none"
                />
              ) : uiTheme === "cute" ? (
                <img
                  src="/illustrations/empty_state_cat.jpg"
                  alt="Relaxing Cat"
                  className="w-24 h-24 rounded-2xl object-cover shadow-md shadow-pink-500/20 border-2 border-white/80 dark:border-zinc-700/80 animate-float-bob select-none"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                  <Calendar className="w-7 h-7" />
                </div>
              )}
            </div>
            <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
              {uiTheme === "yohan"
                ? todayEvents.length > 0 && completedCount === todayEvents.length
                  ? "Go Yohan: Giỏi lắm! Hoàn thành hết 100% rồi! 🥛"
                  : "Go Yohan: Hôm nay bạn thảnh thơi rồi nè 🌸"
                : uiTheme === "cute"
                  ? "Hôm nay bạn đã thảnh thơi rồi!"
                  : "Không còn lịch trình hôm nay"}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {uiTheme === "yohan"
                ? todayEvents.length > 0 && completedCount === todayEvents.length
                  ? "Đã hoàn thành tất cả nhiệm vụ trong ngày. Tự thưởng một ly cà phê ấm nhé!"
                  : "Chưa có thêm lịch trình, thư giãn ôm gối hoặc lên kế hoạch mới cùng Yohan nhé~"
                : uiTheme === "cute"
                  ? "Không còn lịch nào cả, nhâm nhi ly trà sữa và nghỉ ngơi bạn nha~ ✨"
                  : "Tất cả các công việc trong ngày đã hoàn thành hoặc chưa có lịch mới."}
            </div>
            {onLoadSampleSchedule && (
              <button
                type="button"
                onClick={onLoadSampleSchedule}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 animate-star-twinkle" />
                <span>Nạp lịch mẫu hôm nay</span>
              </button>
            )}
          </div>
        )}

        {/* Today's list */}
        <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {" "}
          {todayEvents.map((ev) => {
            const start = new Date(ev.startTime);
            const end = new Date(ev.endTime);

            if (ev.isTravelBuffer) {
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="p-2 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 text-xs flex items-center justify-between gap-2 transition hover:bg-amber-100/70 dark:hover:bg-amber-900/40 cursor-pointer squishy-pop"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {uiTheme === "cute" ? (
                      <img
                        src="/illustrations/badge_travel.jpg"
                        alt="travel"
                        className="w-6 h-6 rounded-lg object-cover shadow-2xs border border-white/80 dark:border-zinc-700/80 shrink-0"
                      />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold text-amber-950 dark:text-amber-100 truncate text-[11px]">
                      {ev.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>
                      {start.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="px-1.5 py-0.2 bg-amber-200/90 dark:bg-amber-800/80 rounded-full text-[9px] font-bold">
                      {ev.bufferMinutes || 25}p
                    </span>
                  </div>
                </div>
              );
            }

            const badgeImg =
              ev.category === "study"
                ? "/illustrations/badge_study.jpg"
                : ev.category === "work"
                  ? "/illustrations/badge_work.jpg"
                  : ev.category === "meeting"
                    ? "/illustrations/badge_meeting.jpg"
                    : ev.category === "break"
                      ? "/illustrations/badge_break.jpg"
                      : "/illustrations/badge_personal.jpg";

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className={`p-2 rounded-2xl border text-xs flex items-center justify-between gap-2 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer squishy-pop ${
                  ev.isCompleted
                    ? "border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-800/20 opacity-60"
                    : "border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckTask(ev.id, ev.isCompleted);
                    }}
                    className={`shrink-0 transition-transform active:scale-75 ${
                      ev.isCompleted
                        ? "text-emerald-600 dark:text-emerald-400 scale-105"
                        : "text-zinc-400 hover:text-emerald-500"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  {uiTheme === "cute" ? (
                    <img
                      src={badgeImg}
                      alt=""
                      className="w-6 h-6 rounded-lg object-cover shadow-2xs border border-white/70 dark:border-zinc-700/70 shrink-0"
                    />
                  ) : (
                    <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                      {React.createElement(getCategoryVectorIcon(ev.category), { className: "w-3.5 h-3.5" })}
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

                <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-zinc-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>
                    {start.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {ev.hasMeet && <Video className="w-3 h-3 text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
