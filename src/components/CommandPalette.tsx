import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  Calendar,
  Clock,
  CheckSquare,
  FileSpreadsheet,
  Mail,
  BarChart3,
  FolderOpen,
  Camera,
  Users,
  FastForward,
  Zap,
  Car,
  Sun,
  Moon,
  ArrowRight,
  Command,
} from "lucide-react";
import { ScheduleItem } from "../types/schedule";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleItem[];
  onSelectEvent: (event: ScheduleItem) => void;
  onOpenPomodoro: () => void;
  onOpenAnalytics: () => void;
  onOpenSheets: () => void;
  onOpenGmail: () => void;
  onOpenTemplates: () => void;
  onOpenTasks: () => void;
  onOpenOcrScanner: () => void;
  onOpenTeamMeeting: () => void;
  onOpenReschedule: () => void;
  onOpenEnergyMatcher: () => void;
  onOpenTravelBuffer?: () => void;
  onResetToday: () => void;
  onChangeViewMode: (mode: "week" | "day" | "agenda") => void;
  onToggleDarkMode: () => void;
  isDarkMode?: boolean;
  onFocusAiInput?: () => void;
}

interface CommandAction {
  id: string;
  category: "ai" | "workspace" | "tools" | "navigation" | "events";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  events,
  onSelectEvent,
  onOpenPomodoro,
  onOpenAnalytics,
  onOpenSheets,
  onOpenGmail,
  onOpenTemplates,
  onOpenTasks,
  onOpenOcrScanner,
  onOpenTeamMeeting,
  onOpenReschedule,
  onOpenEnergyMatcher,
  onOpenTravelBuffer,
  onResetToday,
  onChangeViewMode,
  onToggleDarkMode,
  isDarkMode,
  onFocusAiInput,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Build command actions
  const baseActions: CommandAction[] = [
    // AI Actions
    {
      id: "ai-prompt",
      category: "ai",
      title: "Gõ lệnh xếp lịch bằng AI",
      subtitle: "Nhập yêu cầu ngôn ngữ tự nhiên để Gemini xếp lịch",
      icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
      shortcut: "AI",
      action: () => {
        onClose();
        onFocusAiInput?.();
      },
    },
    {
      id: "ai-ocr",
      category: "ai",
      title: "Quét ảnh / PDF Thời khóa biểu (OCR)",
      subtitle: "Trích xuất tự động môn học từ hình ảnh hoặc PDF",
      icon: <Camera className="w-4 h-4 text-purple-500" />,
      action: () => {
        onClose();
        onOpenOcrScanner();
      },
    },
    {
      id: "ai-energy",
      category: "ai",
      title: "Tối ưu hóa theo nhịp sinh học (Chronotype)",
      subtitle: "Xếp lịch theo giờ vàng năng lượng",
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      action: () => {
        onClose();
        onOpenEnergyMatcher();
      },
    },
    {
      id: "ai-reschedule",
      category: "ai",
      title: "Tự động dời lịch khi bị trễ",
      subtitle: "Sắp xếp lại các việc còn lại trong ngày",
      icon: <FastForward className="w-4 h-4 text-rose-500" />,
      action: () => {
        onClose();
        onOpenReschedule();
      },
    },
    {
      id: "ai-team-meeting",
      category: "ai",
      title: "Tìm giờ họp chung cho nhóm",
      subtitle: "Phát hiện khung giờ trống & tạo link bình chọn",
      icon: <Users className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onClose();
        onOpenTeamMeeting();
      },
    },
    ...(onOpenTravelBuffer
      ? [
          {
            id: "ai-travel",
            category: "ai" as const,
            title: "Chèn thời gian di chuyển (Travel Buffer)",
            subtitle: "Tự động chèn khoảng đệm di chuyển giữa các địa điểm",
            icon: <Car className="w-4 h-4 text-orange-500" />,
            action: () => {
              onClose();
              onOpenTravelBuffer();
            },
          },
        ]
      : []),

    // Tools & Workspace
    {
      id: "tool-pomodoro",
      category: "tools",
      title: "Đồng hồ Pomodoro Focus",
      subtitle: "Bắt đầu phiên làm việc tập trung 25/5 hoặc 50/10",
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      shortcut: "P",
      action: () => {
        onClose();
        onOpenPomodoro();
      },
    },
    {
      id: "tool-analytics",
      category: "tools",
      title: "Thống kê năng suất & Báo cáo tuần",
      subtitle: "Xem biểu đồ phân bổ thời gian và điểm số",
      icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
      action: () => {
        onClose();
        onOpenAnalytics();
      },
    },
    {
      id: "tool-templates",
      category: "tools",
      title: "Thư viện mẫu thời khóa biểu",
      subtitle: "Khám phá các template học tập, làm việc, thể thao",
      icon: <FolderOpen className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onClose();
        onOpenTemplates();
      },
    },
    {
      id: "ws-tasks",
      category: "workspace",
      title: "Google Tasks",
      subtitle: "Xem và đồng bộ danh sách việc cần làm",
      icon: <CheckSquare className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onClose();
        onOpenTasks();
      },
    },
    {
      id: "ws-sheets",
      category: "workspace",
      title: "Google Sheets",
      subtitle: "Xuất hoặc nhập lịch trình qua bảng tính",
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
      action: () => {
        onClose();
        onOpenSheets();
      },
    },
    {
      id: "ws-gmail",
      category: "workspace",
      title: "Gmail Digest",
      subtitle: "Gửi email tóm tắt lịch trình trong tuần",
      icon: <Mail className="w-4 h-4 text-rose-500" />,
      action: () => {
        onClose();
        onOpenGmail();
      },
    },

    // Navigation & Settings
    {
      id: "nav-today",
      category: "navigation",
      title: "Quay về ngày Hôm nay",
      subtitle: "Di chuyển nhanh đến ngày hiện tại",
      icon: <Calendar className="w-4 h-4 text-blue-500" />,
      shortcut: "T",
      action: () => {
        onClose();
        onResetToday();
      },
    },
    {
      id: "nav-view-week",
      category: "navigation",
      title: "Chuyển sang chế độ xem Tuần (Week)",
      subtitle: "Xem tổng thể 7 ngày trong tuần",
      icon: <Calendar className="w-4 h-4 text-zinc-500" />,
      action: () => {
        onClose();
        onChangeViewMode("week");
      },
    },
    {
      id: "nav-view-day",
      category: "navigation",
      title: "Chuyển sang chế độ xem Ngày (Day)",
      subtitle: "Tập trung chi tiết từng giờ trong ngày",
      icon: <Calendar className="w-4 h-4 text-zinc-500" />,
      action: () => {
        onClose();
        onChangeViewMode("day");
      },
    },
    {
      id: "nav-view-agenda",
      category: "navigation",
      title: "Chuyển sang chế độ xem Danh sách (Agenda)",
      subtitle: "Liệt kê danh sách các sự kiện tuần tự",
      icon: <Calendar className="w-4 h-4 text-zinc-500" />,
      action: () => {
        onClose();
        onChangeViewMode("agenda");
      },
    },
    {
      id: "theme-toggle",
      category: "navigation",
      title: isDarkMode
        ? "Chuyển sang giao diện Sáng (Light mode)"
        : "Chuyển sang giao diện Tối (Dark mode)",
      subtitle: isDarkMode
        ? "Chuyển nền sáng để dễ nhìn ban ngày"
        : "Chuyển nền tối để dịu mắt ban đêm",
      icon: isDarkMode ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-400" />
      ),
      shortcut: "D",
      action: () => {
        onClose();
        onToggleDarkMode();
      },
    },
  ];

  // Event search actions
  const eventActions: CommandAction[] = events.map((ev) => {
    const start = new Date(ev.startTime);
    const timeStr = `${start.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    })} ${start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    return {
      id: `ev-${ev.id}`,
      category: "events",
      title: ev.title,
      subtitle: `${timeStr} ${ev.location ? `• ${ev.location}` : ""}`,
      icon: <Calendar className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onClose();
        onSelectEvent(ev);
      },
    };
  });

  const allActions = [...baseActions, ...eventActions];

  // Filter actions by query
  const filteredActions = query.trim()
    ? allActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.subtitle?.toLowerCase().includes(query.toLowerCase()),
      )
    : baseActions;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredActions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredActions.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm sự kiện hoặc gõ lệnh (AI, Pomodoro, Sheets, Lịch...)"
            className="w-full bg-transparent px-3 text-sm font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-50 dark:divide-zinc-800/40"
        >
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              Không tìm thấy lệnh hoặc sự kiện nào phù hợp với "{query}"
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 transition-colors ${
                        isSelected
                          ? "bg-indigo-100 dark:bg-indigo-900/60"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                        <span>{action.title}</span>
                      </div>
                      {action.subtitle && (
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                          {action.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {action.shortcut && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-500">
                        {action.shortcut}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">
                ↑
              </kbd>{" "}
              <kbd className="font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">
                ↓
              </kbd>{" "}
              di chuyển
            </span>
            <span>
              <kbd className="font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">
                ↵
              </kbd>{" "}
              chọn
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> Smart Command
          </span>
        </div>
      </div>
    </div>
  );
};
