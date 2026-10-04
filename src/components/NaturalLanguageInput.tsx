import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  SunMedium,
  Moon,
  Sunrise,
  Coffee,
  Zap,
  Camera,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ScheduleItem, UserProfile, Chronotype, UiTheme } from "../types/schedule";
import { AiMascotCartoon } from "./AiMascotCartoon";
import { CapybaraMascot } from "./CapybaraMascot";
import { YohanMascot } from "./YohanMascot";
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
  uiTheme?: UiTheme;
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  currentEvents,
  userProfile,
  onUpdateProfile,
  weekStart,
  onApplyScheduledItems,
  onOpenOcrScanner,
  uiTheme = "cute",
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem("smart_schedule_ai_input_expanded");
    return saved !== null ? saved === "true" : true;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputCompactRef = useRef<HTMLInputElement>(null);

  const toggleExpanded = (val: boolean) => {
    setIsExpanded(val);
    localStorage.setItem("smart_schedule_ai_input_expanded", String(val));
    if (val) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

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
      if (!isExpanded) {
        setIsExpanded(true);
      }
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

  const currentChronotypeObj =
    chronotypeOptions.find((c) => c.type === userProfile.chronotype) ||
    chronotypeOptions[1];

  return (
    <div
      id="natural-language-input-container"
      className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-3.5 sm:p-5 shadow-xl border border-indigo-200/60 dark:border-indigo-900/50 hover:border-indigo-400/80 dark:hover:border-indigo-700/80 transition-all duration-300 group"
    >
      {/* Animated Rainbow Top-Beam */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-amber-400 to-indigo-500 shimmer-flow opacity-90" />

      {/* COMPACT MODE (Thanh tìm kiếm AI tinh gọn, dễ thương) */}
      {!isExpanded && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative shrink-0">
            {uiTheme === "yohan" ? (
              <div className="relative">
                <YohanMascot
                  className="w-10 h-10 animate-float-bob"
                  onClick={() => toggleExpanded(true)}
                  title="Trợ lý Go Yohan ☕"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-zinc-900 rounded-full" />
              </div>
            ) : uiTheme === "capybara" ? (
              <div className="relative">
                <CapybaraMascot
                  className="w-10 h-10 animate-float-bob"
                  onClick={() => toggleExpanded(true)}
                  title="Trợ lý Capybara Thảnh Thơi"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 border-2 border-white dark:border-zinc-900 rounded-full" />
              </div>
            ) : uiTheme === "cute" ? (
              <div className="relative">
                <AiMascotCartoon
                  className="w-10 h-10 animate-float-bob"
                  onClick={() => toggleExpanded(true)}
                  title="Trợ lý AI"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleExpanded(true)}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Trợ lý AI"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0">
            <input
              id="natural-language-input-field"
              ref={inputCompactRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => toggleExpanded(true)}
              placeholder={
                uiTheme === "yohan"
                  ? "Nhờ Go Yohan quản lý lịch trình giúp bạn (VD: Uống cà phê 9h, làm việc 14h)... ☕"
                  : uiTheme === "capybara"
                    ? "Nhờ Capybara thảnh thơi xếp lịch (VD: Đọc sách 2 tiếng, tối đi cà phê)... 🍊"
                    : uiTheme === "cute"
                      ? "Nhập yêu cầu xếp lịch bằng AI (VD: Xếp 2 tiếng học bài tối nay)... 🌸"
                      : "Nhập yêu cầu xếp lịch bằng AI (VD: Họp dự án 14h thứ 4, học bài 2 tiếng tối nay)..."
              }
              className="w-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition shadow-inner"
            />
          </form>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenOcrScanner && (
              <button
                type="button"
                onClick={onOpenOcrScanner}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/70 rounded-2xl text-xs font-semibold transition cursor-pointer squishy-pop active:scale-95"
                title="Quét ảnh thời khóa biểu (OCR)"
              >
                <Camera className="w-3.5 h-3.5 text-zinc-500" />
                <span>📷 Quét ảnh</span>
              </button>
            )}

            {/* Current Chronotype badge */}
            <button
              onClick={() => toggleExpanded(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/40 dark:to-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 rounded-2xl text-xs font-bold text-purple-700 dark:text-purple-300 hover:shadow-xs transition squishy-pop active:scale-95 cursor-pointer"
              title={`Nhịp sinh học: ${currentChronotypeObj.label}`}
            >
              {currentChronotypeObj.icon}
              <span className="hidden lg:inline">{currentChronotypeObj.label}</span>
            </button>

            {/* Submit / Expand buttons */}
            {prompt.trim() ? (
              <button
                onClick={() => handleSubmit()}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/25 btn-chubby-primary flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Xếp ngay ✦</span>
              </button>
            ) : (
              <button
                onClick={() => toggleExpanded(true)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                title="Mở rộng khung nhập liệu AI"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* FULL EXPANDED MODE */}
      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                {uiTheme === "yohan" ? (
                  <YohanMascot
                    className="w-11 h-11 animate-float-bob"
                    title="Trợ lý Go Yohan ☕"
                  />
                ) : uiTheme === "capybara" ? (
                  <CapybaraMascot
                    className="w-11 h-11 animate-float-bob"
                    title="Trợ lý Capybara Thảnh Thơi"
                  />
                ) : uiTheme === "cute" ? (
                  <AiMascotCartoon
                    className="w-11 h-11 animate-float-bob"
                    title="Trợ lý AI"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Trợ lý</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      uiTheme === "yohan"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700 dark:border-zinc-300"
                        : uiTheme === "capybara"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          : uiTheme === "cute"
                            ? "bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                            : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    }`}
                  >
                    {uiTheme === "yohan" ? "AI ☕" : uiTheme === "capybara" ? "AI 🍊" : "AI"}
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Chronotype selector */}
              <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-2xl gap-0.5">
                {chronotypeOptions.map((opt) => {
                  const active = userProfile.chronotype === opt.type;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => onUpdateProfile({ chronotype: opt.type })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer squishy-pop active:scale-95 ${
                        active
                          ? "bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-xs"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                      title={opt.desc}
                    >
                      {opt.icon}
                      <span className="hidden md:inline">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Collapse button */}
              <button
                onClick={() => toggleExpanded(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                title="Thu gọn khung AI để xem lịch thoáng hơn"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Input Form */}
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              <textarea
                id="natural-language-input-field"
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder='Ví dụ: "Sắp xếp cho tôi 3 buổi học Toán mỗi tuần, ưu tiên buổi sáng", "Thêm buổi họp Sprint team thứ 4 lúc 15h có Google Meet"... 🌸'
                rows={2}
                className="w-full pl-4 pr-24 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition resize-none"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                {onOpenOcrScanner && (
                  <button
                    type="button"
                    onClick={onOpenOcrScanner}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 rounded-2xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer squishy-pop active:scale-95"
                    title="Quét ảnh thời khóa biểu (OCR)"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">📷 Quét ảnh</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:opacity-95 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/25 btn-chubby-primary flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xếp...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Xếp lịch ✦</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick prompt suggestions */}
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
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
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
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      AI đã phân bổ xong {previewResult.items?.length || 0} khung giờ
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
      )}
    </div>
  );
};
