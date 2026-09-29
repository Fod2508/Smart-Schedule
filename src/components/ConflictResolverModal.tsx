import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
  Loader2,
  Calendar,
} from 'lucide-react';
import { ConflictItem, ConflictResolutionOption, ScheduleItem } from '../types/schedule';
import { resolveScheduleConflictWithAI, ConflictResult } from '../services/aiService';

interface ConflictResolverModalProps {
  isOpen: boolean;
  conflict: ConflictItem | null;
  allEvents: ScheduleItem[];
  onClose: () => void;
  onApplyResolution: (option: ConflictResolutionOption, conflict: ConflictItem) => void;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  isOpen,
  conflict,
  allEvents,
  onClose,
  onApplyResolution,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConflictResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && conflict) {
      loadAIResolution();
    } else {
      setResult(null);
      setErrorMsg(null);
    }
  }, [isOpen, conflict]);

  const loadAIResolution = async () => {
    if (!conflict) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await resolveScheduleConflictWithAI(
        conflict.eventA,
        conflict.eventB,
        allEvents
      );
      setResult(res);
    } catch (e: any) {
      setErrorMsg(e.message || 'Không thể tạo phương án giải quyết');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !conflict) return null;

  const formatEventTime = (ev: ScheduleItem) => {
    const s = new Date(ev.startTime);
    const e = new Date(ev.endTime);
    return `${s.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })} • ${s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Phát hiện trùng lịch trình
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gemini AI phân tích mức độ ưu tiên và gợi ý phương án điều chỉnh tối ưu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Conflicting Events Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs">
              <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-200">
                <span className="truncate">{conflict.eventA.title}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-200/70 dark:bg-rose-900 uppercase">
                  {conflict.eventA.priority}
                </span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatEventTime(conflict.eventA)}
              </p>
              {conflict.eventA.hasMeet && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-semibold">
                  Google Meet
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                <span className="truncate">{conflict.eventB.title}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-200/70 dark:bg-amber-900 uppercase">
                  {conflict.eventB.priority}
                </span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatEventTime(conflict.eventB)}
              </p>
              {conflict.eventB.hasMeet && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-semibold">
                  Google Meet
                </span>
              )}
            </div>
          </div>

          {/* AI Analysis and Solutions */}
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span>Gemini AI đang tìm kiếm khung giờ trống tốt nhất...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs text-rose-500">
              {errorMsg}
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Phân tích của Gemini AI:</span>
                </div>
                <p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {result.analysis}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Các phương án đề xuất:
                </span>

                {result.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {opt.title}
                      </h4>
                      <button
                        onClick={() => onApplyResolution(opt, conflict)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Áp dụng</span>
                      </button>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {opt.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="text-emerald-600 dark:text-emerald-400">
                        <span className="font-semibold">Ưu điểm:</span> {opt.pros}
                      </div>
                      <div className="text-amber-600 dark:text-amber-400">
                        <span className="font-semibold">Lưu ý:</span> {opt.cons}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
