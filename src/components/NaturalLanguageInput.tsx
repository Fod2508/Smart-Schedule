import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  RefreshCw,
  SunMedium,
  Moon,
  Sunrise,
  Coffee,
  Zap,
  Camera,
} from "lucide-react";
import { ScheduleItem, UserProfile, Chronotype } from "../types/schedule";
import {
  parseNaturalLanguageSchedule,
  ParseResult,
} from "../services/aiService";

interface NaturalLanguageInputProps {
  currentEvents: ScheduleItem[];
  userProfile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  weekStart: string;
  onApplyScheduledItems: (items: ScheduleItem[], explanation: string) => void;
  onOpenOcrScanner?: () => void;
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  currentEvents,
  userProfile,
  onUpdateProfile,
  weekStart,
  onApplyScheduledItems,
  onOpenOcrScanner,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const quickPrompts = [
    "Sắp xếp cho tôi 3 buổi học Toán mỗi tuần, ưu tiên buổi sáng",
    "Thêm lịch họp Sprint team thứ 3 lúc 14:00 có Google Meet",
    "Xếp lịch ôn thi 3 môn: Tiếng Anh, Lập trình và Triết học trong tuần này",
    "Tôi muốn dành 2 tiếng chiều mai làm dự án cá nhân theo Pomodoro 50/10",
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setPreviewResult(null);

    try {
      const result = await parseNaturalLanguageSchedule(
        prompt,
        currentEvents,
        userProfile,
        weekStart,
      );
      setPreviewResult(result);
    } catch (err: any) {
      console.error("Error generating schedule:", err);
      setErrorMsg(
        err.message || "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreview = () => {
    if (!previewResult || !previewResult.items) return;

    const newItems: ScheduleItem[] = previewResult.items.map((item, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      title: item.title,
      description: item.description || "",
      startTime: item.startTime,
      endTime: item.endTime,
      category: item.category,
      priority: item.priority,
      hasMeet: item.hasMeet,
      pomodoroBlocks: item.pomodoroBlocks || 1,
      source: "ai",
      isSyncedToGoogle: false,
    }));

    onApplyScheduledItems(newItems, previewResult.reasoning);
    setPreviewResult(null);
    setPrompt("");
  };

  const chronotypeOptions: {
    type: Chronotype;
    label: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      type: "morning_bird",
      label: "Chim sớm",
      icon: <Sunrise className="w-3.5 h-3.5 text-amber-500" />,
      desc: "Tập trung sáng (07h-11h)",
    },
    {
      type: "balanced",
      label: "Cân bằng",
      icon: <SunMedium className="w-3.5 h-3.5 text-orange-500" />,
      desc: "Đều các khung giờ",
    },
    {
      type: "night_owl",
      label: "Cú đêm",
      icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
      desc: "Năng suất chiều/tối (14h-22h)",
    },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-zinc-200/90 dark:border-zinc-800 transition-all">
      {/* Header — compact */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Xếp lịch thông minh với Gemini AI
          </h2>
        </div>

        {/* Chronotype pills — compact */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-xl gap-0.5">
          {chronotypeOptions.map((opt) => {
            const active = userProfile.chronotype === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => onUpdateProfile({ chronotype: opt.type })}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  active
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
                title={opt.desc}
              >
                {opt.icon}
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative flex items-center">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder='Ví dụ: "Sắp xếp cho tôi 3 buổi học Toán mỗi tuần, ưu tiên buổi sáng", "Thêm buổi họp nhóm thứ 4 lúc 15h có Google Meet"...'
            rows={2}
            className="w-full pl-4 pr-24 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition resize-none"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
            {onOpenOcrScanner && (
              <button
                type="button"
                onClick={onOpenOcrScanner}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                title="Quét ảnh thời khóa biểu (OCR)"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quét ảnh</span>
              </button>
            )}
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xếp...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Xếp lịch</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick prompt suggestions — chỉ hiện khi focus */}
        {showSuggestions && (
          <div className="mt-3 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Gợi ý:
            </span>
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(q);
                  setShowSuggestions(false);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 border border-zinc-200/50 dark:border-zinc-700/50 transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Error message */}
      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Preview Card before committing */}
      {previewResult && (
        <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  AI đã phân bổ xong {previewResult.items?.length || 0} khung
                  giờ
                </h4>
              </div>
              <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                {previewResult.reasoning}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewResult(null)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyPreview}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Thêm vào lịch tuần</span>
              </button>
            </div>
          </div>

          {/* List of planned items */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {previewResult.items.map((it, idx) => {
              const start = new Date(it.startTime);
              const end = new Date(it.endTime);
              const dayStr = start.toLocaleDateString("vi-VN", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              });
              const timeStr = `${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-zinc-900/90 border border-indigo-100 dark:border-indigo-900/60 text-xs shadow-2xs"
                >
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {it.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>
                      {dayStr} • {timeStr}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {it.category}
                    </span>
                    {it.hasMeet && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Meet
                      </span>
                    )}
                    {it.pomodoroBlocks && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                        <Coffee className="w-3 h-3" /> {it.pomodoroBlocks}P
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
