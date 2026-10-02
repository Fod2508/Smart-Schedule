import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Sun,
  Moon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Coffee,
  HeartPulse,
  Brain,
  Sliders,
  ChevronRight,
  RotateCcw,
  Check,
  Info,
} from "lucide-react";
import {
  ScheduleItem,
  Chronotype,
  TaskEnergyLevel,
  EnergyMatchResult,
} from "../types/schedule";
import { matchEnergyScheduleWithAI } from "../services/aiService";

interface EnergyMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleItem[];
  currentChronotype: Chronotype;
  onUpdateChronotype: (c: Chronotype) => void;
  onApplyOptimizedEvents: (optimized: ScheduleItem[]) => void;
  currentDate: Date;
  showEnergyOverlay: boolean;
  onToggleEnergyOverlay: (val: boolean) => void;
}

export const EnergyMatcherModal: React.FC<EnergyMatcherModalProps> = ({
  isOpen,
  onClose,
  events,
  currentChronotype,
  onUpdateChronotype,
  onApplyOptimizedEvents,
  currentDate,
  showEnergyOverlay,
  onToggleEnergyOverlay,
}) => {
  const [selectedChronotype, setSelectedChronotype] =
    useState<Chronotype>(currentChronotype);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EnergyMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "preview">(
    "overview",
  );
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    setSelectedChronotype(currentChronotype);
  }, [currentChronotype, isOpen]);

  if (!isOpen) return null;

  const chronotypeConfigs: Record<
    Chronotype,
    {
      name: string;
      title: string;
      icon: typeof Sun;
      color: string;
      badgeColor: string;
      borderColor: string;
      description: string;
      peakHours: string;
      slumpHours: string;
      recoveryHours: string;
      bestFor: string;
    }
  > = {
    morning_bird: {
      name: "morning_bird",
      title: "Chim Buổi Sáng",
      icon: Sun,
      color: "text-amber-500",
      badgeColor:
        "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300",
      borderColor: "border-amber-400 dark:border-amber-600",
      description:
        "Dậy sớm tự nhiên, đầu óc sắc bén nhất vào buổi sáng, năng lượng giảm dần vào chiều tối.",
      peakHours: "07:00 - 11:30",
      slumpHours: "13:00 - 15:30",
      recoveryHours: "16:30 - 21:00",
      bestFor: "Môn khó, viết luận, code phức tạp trước 11:30",
    },
    night_owl: {
      name: "night_owl",
      title: "Cú Đêm",
      icon: Moon,
      color: "text-indigo-400",
      badgeColor:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300",
      borderColor: "border-indigo-400 dark:border-indigo-600",
      description:
        "Khởi động chậm vào buổi sáng, năng lượng bùng nổ và sáng tạo cao độ từ chiều muộn đến đêm.",
      peakHours: "16:30 - 22:30+",
      slumpHours: "13:30 - 15:30",
      recoveryHours: "08:00 - 11:00",
      bestFor: "Sáng tạo, bài tập lớn, dự án chuyên sâu từ 17:00",
    },
    balanced: {
      name: "balanced",
      title: "Nhịp Cân Bằng",
      icon: Sparkles,
      color: "text-emerald-500",
      badgeColor:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300",
      borderColor: "border-emerald-400 dark:border-emerald-600",
      description:
        "Bám sát nhịp điệu tự nhiên của mặt trời. Tập trung đỉnh cao giữa buổi sáng, cần xả hơi sau trưa.",
      peakHours: "09:00 - 12:30",
      slumpHours: "13:30 - 15:30",
      recoveryHours: "18:00 - 22:00",
      bestFor: "Hoàn thành việc quan trọng (Eat the Frog) lúc 9h-12h",
    },
  };

  const currentConfig = chronotypeConfigs[selectedChronotype];

  const handleRunMatcher = async () => {
    setIsLoading(true);
    setError(null);
    setIsApplied(false);
    try {
      // Tính Monday của tuần hiện tại để AI có context đúng ngày
      const monday = new Date(currentDate);
      const day = monday.getDay();
      monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
      monday.setHours(0, 0, 0, 0);
      const weekStart = monday.toISOString();

      const res = await matchEnergyScheduleWithAI(
        events,
        selectedChronotype,
        weekStart,
      );
      setResult(res);
      onUpdateChronotype(selectedChronotype);
      setActiveTab("audit");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể xếp lịch theo nhịp sinh học");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (!result || !result.optimizedEvents) return;

    const existingIds = new Set(events.map((e) => e.id));

    // Merge: update events có ID trùng, giữ nguyên events không có trong AI response
    const updated = events.map((orig) => {
      const match = result.optimizedEvents.find((opt) => opt.id === orig.id);
      if (match) {
        return {
          ...orig,
          startTime: match.startTime,
          endTime: match.endTime,
          category: match.category,
          priority: match.priority,
          energyLevel: match.energyLevel,
        };
      }
      return orig;
    });

    // Thêm events mới do AI tạo (ID chưa tồn tại trong schedule)
    const newAiEvents = result.optimizedEvents
      .filter((opt) => !existingIds.has(opt.id))
      .map((opt) => ({
        id: opt.id,
        title: opt.title,
        description: opt.description || "",
        startTime: opt.startTime,
        endTime: opt.endTime,
        category: opt.category,
        priority: opt.priority,
        hasMeet: opt.hasMeet ?? false,
        energyLevel: opt.energyLevel,
        source: "ai" as const,
        isSyncedToGoogle: false,
      }));

    onApplyOptimizedEvents([...updated, ...newAiEvents]);
    setIsApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25 shrink-0">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  Xếp lịch theo nhịp sinh học
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Brain className="w-3.5 h-3.5" />
                  Tối ưu năng lượng
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Xếp việc khó vào giờ minh mẫn nhất, việc nhẹ vào giờ năng lượng
                thấp — đúng với nhịp tự nhiên của cơ thể bạn.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Chronotype Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                1. Chọn nhịp sinh học của bạn
              </label>
              <span className="text-xs text-zinc-400">
                Đang chọn:{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {currentConfig.title}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["morning_bird", "balanced", "night_owl"] as Chronotype[]).map(
                (type) => {
                  const config = chronotypeConfigs[type];
                  const isSelected = selectedChronotype === type;
                  const IconComponent = config.icon;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedChronotype(type);
                        setResult(null); // reset result to re-match for new chronotype
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? `${config.borderColor} bg-amber-50/50 dark:bg-zinc-800/80 ring-2 ring-amber-400/40 shadow-xs`
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className={`w-5 h-5 ${config.color}`} />
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {config.title}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                        {config.description}
                      </p>
                      <div className="space-y-1 text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-700/60">
                        <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                          <span className="font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" /> Giờ vàng:
                          </span>
                          <strong className="text-amber-700 dark:text-amber-300">
                            {config.peakHours}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Coffee className="w-3 h-3 text-orange-400" /> Sụt
                            giảm:
                          </span>
                          <span>{config.slumpHours}</span>
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Section 2: Biological Energy Curve Visualizer */}
          <div className="bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-500" />
                Biểu đồ phân bổ năng lượng trong ngày ({currentConfig.title})
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showEnergyOverlay}
                    onChange={(e) => onToggleEnergyOverlay(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Lớp phủ màu trên Calendar</span>
                </label>
              </div>
            </div>

            {/* Visual Bar representation */}
            <div className="space-y-2">
              <div className="h-5 w-full rounded-xl overflow-hidden flex text-[10px] font-bold text-white shadow-inner">
                {selectedChronotype === "morning_bird" && (
                  <>
                    <div
                      className="bg-amber-500 flex items-center justify-center transition-all"
                      style={{ width: "35%" }}
                      title="07:00 - 11:30: Giờ vàng Đỉnh cao (Peak Focus)"
                    >
                      ⚡ Đỉnh cao (07:00 - 11:30)
                    </div>
                    <div
                      className="bg-indigo-400 flex items-center justify-center"
                      style={{ width: "15%" }}
                      title="11:30 - 13:00: Chuyển tiếp & Ăn trưa"
                    >
                      Ăn trưa
                    </div>
                    <div
                      className="bg-orange-400 flex items-center justify-center"
                      style={{ width: "20%" }}
                      title="13:00 - 15:30: Khung sụt giảm năng lượng (Slump)"
                    >
                      ☕ Việc nhẹ (13:00 - 15:30)
                    </div>
                    <div
                      className="bg-emerald-500 flex items-center justify-center"
                      style={{ width: "30%" }}
                      title="16:00 - 21:00: Hồi phục & Cá nhân"
                    >
                      🌿 Hồi phục (16:00+)
                    </div>
                  </>
                )}

                {selectedChronotype === "night_owl" && (
                  <>
                    <div
                      className="bg-emerald-500 flex items-center justify-center"
                      style={{ width: "25%" }}
                      title="08:00 - 11:00: Khởi động chậm & Hồi phục"
                    >
                      🌿 Khởi động (08:00 - 11:00)
                    </div>
                    <div
                      className="bg-indigo-400 flex items-center justify-center"
                      style={{ width: "20%" }}
                      title="11:00 - 13:30: Việc trung bình / Họp"
                    >
                      Họp / Trung bình
                    </div>
                    <div
                      className="bg-orange-400 flex items-center justify-center"
                      style={{ width: "15%" }}
                      title="13:30 - 15:30: Giờ sụt giảm sau trưa"
                    >
                      ☕ Slump (13:30 - 15:30)
                    </div>
                    <div
                      className="bg-indigo-600 flex items-center justify-center"
                      style={{ width: "40%" }}
                      title="16:30 - 22:30: Giờ vàng Đỉnh cao sáng tạo (Peak Focus)"
                    >
                      ⚡ Giờ vàng sáng tạo (16:30 - 22:30+)
                    </div>
                  </>
                )}

                {selectedChronotype === "balanced" && (
                  <>
                    <div
                      className="bg-emerald-500 flex items-center justify-center"
                      style={{ width: "15%" }}
                      title="08:00 - 09:30: Khởi động buổi sáng"
                    >
                      Khởi động
                    </div>
                    <div
                      className="bg-amber-500 flex items-center justify-center"
                      style={{ width: "30%" }}
                      title="09:00 - 12:30: Giờ vàng Đỉnh cao (Peak Focus)"
                    >
                      ⚡ Đỉnh cao (09:00 - 12:30)
                    </div>
                    <div
                      className="bg-orange-400 flex items-center justify-center"
                      style={{ width: "20%" }}
                      title="13:30 - 15:30: Khung sụt giảm (Slump)"
                    >
                      ☕ Việc nhẹ (13:30 - 15:30)
                    </div>
                    <div
                      className="bg-indigo-500 flex items-center justify-center"
                      style={{ width: "15%" }}
                      title="15:30 - 18:00: Năng lượng ổn định"
                    >
                      Họp / Tối ưu
                    </div>
                    <div
                      className="bg-emerald-500 flex items-center justify-center"
                      style={{ width: "20%" }}
                      title="18:00 - 22:00: Hồi phục & Thể thao"
                    >
                      🌿 Hồi phục
                    </div>
                  </>
                )}
              </div>

              {/* Legends */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>
                    <strong>Khung Đỉnh cao</strong>: Nhiệm vụ môn khó, viết
                    luận, code, tư duy sâu.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                  <span>
                    <strong>Khung Sụt giảm</strong>: Check mail, dọn dẹp file,
                    việc hành chính nhẹ.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>
                    <strong>Khung Hồi phục</strong>: Thể thao, việc cá nhân,
                    giải trí lành mạnh.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          {!result && (
            <div className="text-center py-4">
              <button
                type="button"
                onClick={handleRunMatcher}
                disabled={isLoading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-98 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-60"
              >
                <Sparkles
                  className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>
                  {isLoading
                    ? "AI đang phân tích lịch của bạn..."
                    : `Phân tích & tối ưu theo nhịp ${currentConfig.title}`}
                </span>
              </button>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                AI sẽ xem xét {events.length} sự kiện và đề xuất khung giờ phù
                hợp hơn.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results View */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Score & Overview card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Alignment Score Gauge */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/80 dark:border-amber-800/80 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Điểm phù hợp với nhịp sinh học
                  </span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400">
                      {result.energyAlignmentScore}
                    </span>
                    <span className="text-sm font-semibold text-zinc-400">
                      / 100
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {result.scoreExplanation}
                  </p>
                </div>

                {/* Mismatches stats */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Sự kiện chưa khớp nhịp sinh học
                  </span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span
                      className={`text-3xl sm:text-4xl font-extrabold ${
                        result.mismatchesCount > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600"
                      }`}
                    >
                      {result.mismatchesCount}
                    </span>
                    <span className="text-xs text-zinc-400">
                      cần điều chỉnh
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {result.mismatchesCount > 0
                      ? "Làm việc khó vào giờ đuối sức hoặc lãng phí giờ vàng."
                      : "Tuyệt vời! Lịch của bạn hoàn toàn hòa hợp với nhịp sinh học."}
                  </p>
                </div>

                {/* Coach Advice */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-indigo-500" />
                    Gợi ý từ AI
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-2 line-clamp-4 leading-relaxed">
                    {result.chronotypeAdvice}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("audit")}
                  className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "audit"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Phân tích từng sự kiện ({result.audits.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Lịch sau khi tối ưu ({result.optimizedEvents.length})
                  </span>
                </button>
              </div>

              {/* Tab 1: Audit List */}
              {activeTab === "audit" && (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {result.audits.map((item, idx) => {
                    const energyBadges: Record<
                      TaskEnergyLevel,
                      { label: string; color: string; icon: typeof Zap }
                    > = {
                      peak_focus: {
                        label: "Cần Đỉnh cao",
                        color: "bg-amber-100 text-amber-800 border-amber-300",
                        icon: Zap,
                      },
                      light_admin: {
                        label: "Việc nhẹ / Slump",
                        color:
                          "bg-orange-100 text-orange-800 border-orange-300",
                        icon: Coffee,
                      },
                      recovery: {
                        label: "Hồi phục / Cá nhân",
                        color:
                          "bg-emerald-100 text-emerald-800 border-emerald-300",
                        icon: HeartPulse,
                      },
                    };

                    const badge =
                      energyBadges[item.detectedEnergyLevel] ||
                      energyBadges.light_admin;
                    const IconComp = badge.icon;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isOptimal
                            ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-950 dark:bg-emerald-950/20"
                            : "border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {item.isOptimal ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {item.taskTitle}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border flex items-center gap-1 ${badge.color}`}
                              >
                                <IconComp className="w-3 h-3" />
                                {badge.label}
                              </span>
                            </div>
                            <div className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                              <span>
                                Khung giờ hiện tại:{" "}
                                <strong>{item.currentSlotTime}</strong>
                              </span>
                            </div>
                            {!item.isOptimal && item.mismatchReason && (
                              <p className="text-rose-700 dark:text-rose-300 font-medium mt-1">
                                ⚠️ {item.mismatchReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {!item.isOptimal && item.suggestedSlotTime && (
                          <div className="text-right sm:self-center shrink-0">
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 block">
                              Giờ đề xuất:
                            </span>
                            <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                              {item.suggestedSlotTime}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Preview Optimized Schedule */}
              {activeTab === "preview" && (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Dưới đây là lịch trình đã được AI tái cấu trúc: nhiệm vụ
                      khó dời vào giờ minh mẫn nhất, việc nhẹ vào giờ sụt giảm,
                      đảm bảo không trùng giờ.
                    </span>
                  </div>

                  {result.optimizedEvents.map((ev, idx) => {
                    const start = new Date(ev.startTime);
                    const end = new Date(ev.endTime);
                    const timeStr = `${start.toLocaleDateString("vi-VN", {
                      weekday: "short",
                    })}, ${start.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${end.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;

                    const energyLabels: Record<
                      TaskEnergyLevel,
                      { label: string; color: string }
                    > = {
                      peak_focus: {
                        label: "⚡ Đỉnh cao",
                        color:
                          "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
                      },
                      light_admin: {
                        label: "☕ Việc nhẹ",
                        color:
                          "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
                      },
                      recovery: {
                        label: "🌿 Hồi phục",
                        color:
                          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
                      },
                    };
                    const energy =
                      energyLabels[ev.energyLevel] || energyLabels.light_admin;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {ev.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${energy.color}`}
                            >
                              {energy.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500 mt-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{timeStr}</span>
                          </div>
                          {ev.reasoning && (
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 italic">
                              💡 {ev.reasoning}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
          >
            Đóng
          </button>

          {result && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunMatcher}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Phân tích lại</span>
              </button>

              <button
                type="button"
                onClick={handleApplyChanges}
                disabled={isApplied}
                className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                  isApplied
                    ? "bg-emerald-600"
                    : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã áp dụng thành công!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Áp dụng lịch tối ưu năng lượng</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
