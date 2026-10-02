import React, { useState, useEffect } from "react";
import {
  X,
  FastForward,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Check,
  RotateCcw,
  Loader2,
  CalendarDays,
  Sun,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { ScheduleItem } from "../types/schedule";
import {
  smartRescheduleWithAI,
  SmartRescheduleResult,
  RescheduleChange,
} from "../services/aiService";

interface SmartRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvents: ScheduleItem[];
  preselectedEventId?: string | null;
  targetDate: string;
  onApplyRescheduledEvents: (
    updatedEvents: ScheduleItem[],
    impactSummary: string,
  ) => void;
}

export const SmartRescheduleModal: React.FC<SmartRescheduleModalProps> = ({
  isOpen,
  onClose,
  currentEvents,
  preselectedEventId = null,
  targetDate,
  onApplyRescheduledEvents,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    preselectedEventId || "",
  );
  const [delayMinutes, setDelayMinutes] = useState<number>(45);
  const [reason, setReason] = useState<string>(
    "Nội dung công việc kéo dài hơn dự kiến",
  );
  const [strategy, setStrategy] = useState<
    "prioritize" | "push_all" | "overflow_tomorrow"
  >("prioritize");

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmartRescheduleResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEventId(preselectedEventId);
    } else if (currentEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(currentEvents[0].id);
    }
  }, [preselectedEventId, currentEvents]);

  if (!isOpen) return null;

  const quickMinutes = [15, 30, 45, 60, 90, 120];
  const quickReasons = [
    "Nội dung công việc kéo dài hơn dự kiến",
    "Cuộc họp thảo luận thêm thời gian",
    "Kẹt xe / Di chuyển đến muộn",
    "Phát sinh việc đột xuất khẩn cấp",
  ];

  const handleRunAI = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await smartRescheduleWithAI(
        selectedEventId || null,
        delayMinutes,
        reason.trim(),
        strategy,
        currentEvents,
        targetDate,
      );
      setResult(res);
    } catch (err: any) {
      console.error("Smart reschedule error:", err);
      setErrorMsg(err.message || "Lỗi khi AI thực hiện dời lịch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmApply = () => {
    if (!result) return;
    onApplyRescheduledEvents(result.updatedEvents, result.impactSummary);
    onClose();
  };

  const getActionBadge = (action: RescheduleChange["action"]) => {
    switch (action) {
      case "delayed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Kéo dài +{delayMinutes}p
          </span>
        );
      case "shifted":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Dời lùi giờ
          </span>
        );
      case "shortened":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
            Rút ngắn thời lượng
          </span>
        );
      case "moved_to_tomorrow":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            Chuyển sang ngày mai
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Bảo toàn
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <FastForward className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Xử lý trễ việc & sắp xếp lại lịch
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  AI tự động
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Khi một việc bị kéo dài, AI tự sắp xếp lại các việc còn lại —
                bảo vệ cuộc họp quan trọng, tránh chồng chéo lịch.
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

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Form Controls */}
          <div className="space-y-3.5">
            {/* 1. Chọn sự kiện bị kéo dài */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Công việc đang bị kéo dài hoặc trễ giờ *
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                <option value="">
                  -- Trễ từ mốc thời gian hiện tại (không gắn sự kiện cụ thể) --
                </option>
                {currentEvents.map((ev) => {
                  const sTime = new Date(ev.startTime).toLocaleTimeString(
                    "vi-VN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );
                  const eTime = new Date(ev.endTime).toLocaleTimeString(
                    "vi-VN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );
                  return (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({sTime} - {eTime})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. Số phút kéo dài thêm */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Thời gian bị trễ / kéo dài thêm:{" "}
                  <span className="text-amber-600 font-bold">
                    {delayMinutes} phút
                  </span>
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {quickMinutes.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDelayMinutes(mins)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      delayMinutes === mins
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    +{mins}p
                  </button>
                ))}
                <div className="inline-flex items-center gap-1 ml-2">
                  <input
                    type="number"
                    min={5}
                    max={360}
                    step={5}
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center"
                  />
                  <span className="text-xs text-zinc-500">phút</span>
                </div>
              </div>
            </div>

            {/* 3. Lý do trễ */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Lý do phát sinh
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Họp thảo luận kéo dài, kẹt xe, bài tập khó..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {quickReasons.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(qr)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Chiến lược dời lịch */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Chiến lược điều phối của AI
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStrategy("prioritize")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    strategy === "prioritize"
                      ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
                      : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Ưu tiên thông minh</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                    Giữ nguyên cuộc họp & deadline quan trọng. Dời các việc linh
                    hoạt vào khoảng trống hoặc cuối ngày.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy("push_all")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    strategy === "push_all"
                      ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
                      : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                    <FastForward className="w-4 h-4 text-blue-600" />
                    <span>Đẩy lùi nối tiếp</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                    Dời lùi tất cả các việc tiếp theo đúng {delayMinutes} phút,
                    giữ nguyên thời lượng từng việc.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy("overflow_tomorrow")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    strategy === "overflow_tomorrow"
                      ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
                      : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                    <Sun className="w-4 h-4 text-purple-600" />
                    <span>Dời sang ngày mai</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                    Giữ việc quan trọng trong ngày, dời việc chưa gấp sang sáng
                    mai để kết thúc ngày đúng giờ.
                  </p>
                </button>
              </div>
            </div>

            {/* Run AI Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleRunAI}
                disabled={isLoading}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI đang sắp xếp lại lịch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {result
                        ? "Phân tích lại với thông số mới"
                        : "Phân tích & sắp xếp lại lịch"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Result Comparison View */}
          {result && (
            <div className="space-y-3.5 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in">
              {/* Explanation & Impact Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-900 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Giải pháp dời lịch của Gemini AI:</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white shadow-2xs">
                    {result.impactSummary}
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {/* Changes Diff List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Chi tiết các thay đổi trên lịch trình (
                    {result.changes.length} sự kiện):
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {result.changes.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {ch.title}
                          </span>
                          {getActionBadge(ch.action)}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {ch.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                        <span className="text-zinc-400 line-through text-[11px]">
                          {ch.originalTime}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                          {ch.newTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Bottom Bar */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">
                  Sẽ cập nhật vào thời khóa biểu và đồng bộ Google Calendar nếu
                  có
                </span>

                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Lịch Mới Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
