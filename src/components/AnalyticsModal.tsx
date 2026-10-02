import React, { useState } from "react";
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
  onApplyOptimizedEvents: (optimized: ScheduleItem[]) => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  events,
  userProfile,
  onApplyOptimizedEvents,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate stats
  let totalMinutes = 0;
  const categoryMinutes: Record<string, number> = {
    study: 0,
    work: 0,
    meeting: 0,
    break: 0,
    personal: 0,
  };

  events.forEach((ev) => {
    const s = new Date(ev.startTime).getTime();
    const e = new Date(ev.endTime).getTime();
    const diffMins = Math.max(0, Math.round((e - s) / (1000 * 60)));
    totalMinutes += diffMins;
    if (categoryMinutes[ev.category] !== undefined) {
      categoryMinutes[ev.category] += diffMins;
    } else {
      categoryMinutes.personal += diffMins;
    }
  });

  const totalHours = (totalMinutes / 60).toFixed(1);
  const studyHours = (categoryMinutes.study / 60).toFixed(1);
  const workHours = (categoryMinutes.work / 60).toFixed(1);
  const meetingHours = (categoryMinutes.meeting / 60).toFixed(1);
  const breakHours = (categoryMinutes.break / 60).toFixed(1);

  const completedCount = events.filter((e) => e.isCompleted).length;
  const completionRate =
    events.length > 0 ? Math.round((completedCount / events.length) * 100) : 0;

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    setErrorMsg(null);
    try {
      const res = await optimizeScheduleWithAI(events, userProfile);
      setOptimizationResult(res);
    } catch (e: any) {
      setErrorMsg(e.message || "Lỗi khi tối ưu hóa");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApply = () => {
    if (!optimizationResult) return;
    // Giữ nguyên id gốc để cập nhật in-place, tránh tạo duplicate
    const newItems: ScheduleItem[] = optimizationResult.optimizedEvents.map(
      (item, idx) => ({
        id: (item as any).id || `opt-${Date.now()}-${idx}`,
        title: item.title,
        description: item.description || "",
        startTime: item.startTime,
        endTime: item.endTime,
        category: item.category,
        priority: item.priority,
        hasMeet: item.hasMeet ?? false,
        source: "ai" as const,
        isSyncedToGoogle: false,
      }),
    );
    onApplyOptimizedEvents(newItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Thống Kê Năng Suất & Tối Ưu Lịch Trình
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Phân tích cân bằng môn học và tự động chèn khoảng nghỉ hợp lý
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

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-500">
                Tổng thời gian
              </span>
              <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                {totalHours}h
              </div>
              <span className="text-[10px] text-zinc-400">
                {events.length} sự kiện
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Học tập
              </span>
              <div className="text-xl font-black text-blue-950 dark:text-blue-100 mt-0.5">
                {studyHours}h
              </div>
              <span className="text-[10px] text-blue-500/80">Deep Work</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Họp & Meet
              </span>
              <div className="text-xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
                {meetingHours}h
              </div>
              <span className="text-[10px] text-emerald-500/80">Giao tiếp</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Nghỉ ngơi
              </span>
              <div className="text-xl font-black text-amber-950 dark:text-amber-100 mt-0.5">
                {breakHours}h
              </div>
              <span className="text-[10px] text-amber-500/80">
                Tái tạo năng lượng
              </span>
            </div>
          </div>

          {/* Progress & Distribution Bar */}
          <div className="space-y-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span>Phân bổ thời gian theo danh mục</span>
              <span>Tỷ lệ hoàn thành: {completionRate}%</span>
            </div>

            {/* Stacked bar */}
            <div className="h-3 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex">
              {totalMinutes > 0 ? (
                <>
                  <div
                    style={{
                      width: `${(categoryMinutes.study / totalMinutes) * 100}%`,
                    }}
                    className="bg-blue-500 h-full"
                    title={`Học tập: ${studyHours}h`}
                  />
                  <div
                    style={{
                      width: `${(categoryMinutes.work / totalMinutes) * 100}%`,
                    }}
                    className="bg-indigo-500 h-full"
                    title={`Công việc: ${workHours}h`}
                  />
                  <div
                    style={{
                      width: `${(categoryMinutes.meeting / totalMinutes) * 100}%`,
                    }}
                    className="bg-emerald-500 h-full"
                    title={`Cuộc họp: ${meetingHours}h`}
                  />
                  <div
                    style={{
                      width: `${(categoryMinutes.break / totalMinutes) * 100}%`,
                    }}
                    className="bg-amber-400 h-full"
                    title={`Nghỉ ngơi: ${breakHours}h`}
                  />
                  <div
                    style={{
                      width: `${(categoryMinutes.personal / totalMinutes) * 100}%`,
                    }}
                    className="bg-purple-400 h-full"
                    title="Cá nhân"
                  />
                </>
              ) : (
                <div className="w-full bg-zinc-300 dark:bg-zinc-700" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Học
                tập ({studyHours}h)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Công
                việc ({workHours}h)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
                Cuộc họp ({meetingHours}h)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Nghỉ
                ngơi ({breakHours}h)
              </span>
            </div>
          </div>

          {/* AI Auto-Balance Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-zinc-900 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Gemini AI Auto-balance & Tối ưu giờ nghỉ</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Phân tích độ dồn ứ môn học và tự động chèn các block Pomodoro
                  Rest để chống kiệt sức
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
              <div className="text-xs text-rose-600 dark:text-rose-400">
                {errorMsg}
              </div>
            )}

            {optimizationResult && (
              <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 text-center shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      Điểm số
                    </span>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {optimizationResult.productivityScore}/100
                    </div>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {optimizationResult.scoreExplanation}
                  </p>
                </div>

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

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Áp dụng lịch trình đã tối ưu (
                      {optimizationResult.optimizedEvents.length} sự kiện)
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
