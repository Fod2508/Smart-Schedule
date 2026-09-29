import React from 'react';
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
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';

interface TodayWidgetProps {
  events: ScheduleItem[];
  onSelectEvent: (event: ScheduleItem) => void;
  onOpenPomodoroForEvent: (event: ScheduleItem) => void;
  onToggleComplete: (eventId: string) => void;
  onOpenReschedule?: (eventId?: string) => void;
  onOpenTravelBuffer?: () => void;
}

export const TodayWidget: React.FC<TodayWidgetProps> = ({
  events,
  onSelectEvent,
  onOpenPomodoroForEvent,
  onToggleComplete,
  onOpenReschedule,
  onOpenTravelBuffer,
}) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const todayEvents = events
    .filter((e) => {
      const d = new Date(e.startTime);
      return d.toISOString().split('T')[0] === todayStr;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Find next upcoming event
  const nowTime = today.getTime();
  const nextEvent = todayEvents.find((e) => new Date(e.endTime).getTime() > nowTime);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-zinc-200/90 dark:border-zinc-800 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Lịch trình hôm nay ({today.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })})
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {todayEvents.length} việc
          </span>
        </div>

        {/* Current / Next Focus Card */}
        {nextEvent ? (
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Việc tiếp theo cần chú ý
              </span>
              <span>
                {new Date(nextEvent.startTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-1 truncate">
              {nextEvent.title}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <button
                onClick={() => onOpenPomodoroForEvent(nextEvent)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Bật Pomodoro</span>
              </button>

              {nextEvent.hasMeet && (
                <a
                  href={nextEvent.meetLink || 'https://meet.google.com/new'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Video className="w-3 h-3" />
                  <span>Google Meet</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center text-xs text-zinc-400">
            Không còn lịch trình nào trong hôm nay. Bạn có thể nghỉ ngơi! ✨
          </div>
        )}

        {/* Today's list */}
        <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {todayEvents.map((ev) => {
            const start = new Date(ev.startTime);
            const end = new Date(ev.endTime);

            if (ev.isTravelBuffer) {
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="p-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 text-xs flex items-center justify-between gap-2 transition hover:bg-amber-100/70 dark:hover:bg-amber-900/40 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded-md bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 shrink-0">
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-amber-950 dark:text-amber-100 truncate text-[11px]">
                      {ev.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>
                      {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="px-1 py-0.2 bg-amber-200/90 dark:bg-amber-800/80 rounded text-[9px] font-bold">
                      {ev.bufferMinutes || 25}p
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer ${
                  ev.isCompleted
                    ? 'border-zinc-200 dark:border-zinc-800 opacity-60'
                    : 'border-zinc-200/80 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(ev.id);
                    }}
                    className={`shrink-0 transition ${
                      ev.isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <span
                    className={`font-medium truncate ${
                      ev.isCompleted
                        ? 'line-through text-zinc-400'
                        : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {ev.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-zinc-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>
                    {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {ev.hasMeet && <Video className="w-3 h-3 text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Action Triggers */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          {onOpenTravelBuffer && (
            <button
              type="button"
              onClick={onOpenTravelBuffer}
              className="w-full py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Car className="w-3.5 h-3.5 text-orange-600" />
              <span>Đệm di chuyển & chuẩn bị (Travel Buffer)</span>
            </button>
          )}

          {onOpenReschedule && todayEvents.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenReschedule(nextEvent?.id)}
              className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-600" />
              <span>Bị trễ việc? AI Dời Lịch Tự Động</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
