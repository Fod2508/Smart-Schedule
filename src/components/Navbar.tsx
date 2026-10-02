import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  FileSpreadsheet,
  Mail,
  Clock,
  BarChart3,
  Moon,
  Sun,
  AlertTriangle,
  Wifi,
  WifiOff,
  LogOut,
  FolderOpen,
  Camera,
  Users,
  FastForward,
  Zap,
  Car,
  ChevronDown,
} from "lucide-react";
import { User } from "firebase/auth";

interface NavbarProps {
  user: User | null;
  hasWorkspaceToken: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  conflictCount: number;
  onOpenConflicts: () => void;
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
  isOnline: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  hasWorkspaceToken,
  isLoggingIn,
  onLogin,
  onLogout,
  conflictCount,
  onOpenConflicts,
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
  isOnline,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // AI-heavy features go in dropdown
  const aiTools = [
    {
      icon: <Camera className="w-4 h-4" />,
      label: "Quét ảnh thời khóa biểu",
      desc: "Nhận diện lịch từ ảnh hoặc PDF",
      onClick: onOpenOcrScanner,
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Tìm giờ họp chung",
      desc: "Tìm khung giờ trống & tạo bình chọn",
      onClick: onOpenTeamMeeting,
    },
    {
      icon: <FastForward className="w-4 h-4" />,
      label: "Xử lý trễ việc",
      desc: "Tự động sắp xếp lại khi bị trễ giờ",
      onClick: onOpenReschedule,
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Tối ưu theo năng lượng",
      desc: "Xếp lịch theo nhịp sinh học cá nhân",
      onClick: onOpenEnergyMatcher,
    },
    ...(onOpenTravelBuffer
      ? [
          {
            icon: <Car className="w-4 h-4" />,
            label: "Thêm thời gian di chuyển",
            desc: "Tự động chèn khoảng đệm giữa 2 lịch",
            onClick: onOpenTravelBuffer,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight hidden sm:block">
              Smart Schedule
            </span>
          </div>

          {/* Center tool buttons */}
          <div className="flex items-center gap-1 flex-1 justify-center">
            {/* Conflict badge */}
            {conflictCount > 0 && (
              <button
                onClick={onOpenConflicts}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl transition animate-pulse mr-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trùng lịch</span>
                <span className="px-1.5 bg-rose-600 text-white rounded-full text-[10px] leading-5">
                  {conflictCount}
                </span>
              </button>
            )}

            {/* Pomodoro */}
            <button
              onClick={onOpenPomodoro}
              title="Pomodoro Timer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-zinc-600 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 transition"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Pomodoro</span>
            </button>

            {/* Tasks */}
            <button
              onClick={onOpenTasks}
              title="Google Tasks"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden md:inline">Tasks</span>
            </button>

            {/* Sheets */}
            <button
              onClick={onOpenSheets}
              title="Google Sheets — Xuất/Nhập lịch"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Sheets</span>
            </button>

            {/* Gmail */}
            <button
              onClick={onOpenGmail}
              title="Gmail Schedule Digest"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition"
            >
              <Mail className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden lg:inline">Gmail</span>
            </button>

            {/* Templates */}
            <button
              onClick={onOpenTemplates}
              title="Thư viện mẫu thời khóa biểu"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden lg:inline">Mẫu</span>
            </button>

            {/* Analytics */}
            <button
              onClick={onOpenAnalytics}
              title="Thống kê & Tối ưu hóa lịch trình"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden md:inline">Lịch trình</span>
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

            {/* AI Tools dropdown — chỉ chứa các tính năng AI nặng */}
            <div className="relative" ref={toolsRef}>
              <button
                onClick={() => setIsToolsOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  isToolsOpen
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border-indigo-200/80 dark:border-indigo-800/80"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Tools</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${isToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isToolsOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                      Tính năng AI
                    </span>
                  </div>
                  <div className="py-1">
                    {aiTools.map((tool, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          tool.onClick?.();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition group"
                      >
                        <span className="text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 shrink-0 transition-colors">
                          {tool.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                            {tool.label}
                          </div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                            {tool.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side — status & auth */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Online status */}
            <div
              className={`p-2 rounded-xl ${isOnline ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}`}
              title={isOnline ? "Đang trực tuyến" : "Ngoại tuyến"}
            >
              {isOnline ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
            </div>

            {/* Dark mode */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Chuyển sáng/tối"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Auth */}
            {user && hasWorkspaceToken ? (
              <div className="flex items-center gap-1 pl-1 border-l border-zinc-200 dark:border-zinc-700 ml-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Avatar"}
                    className="w-7 h-7 rounded-full border border-zinc-300 dark:border-zinc-600"
                    title={user.email || ""}
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs"
                    title={user.email || ""}
                  >
                    {user.displayName?.charAt(0) ||
                      user.email?.charAt(0) ||
                      "U"}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-xs transition cursor-pointer disabled:opacity-60 ml-1"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span className="hidden sm:inline">
                  {isLoggingIn ? "Đang kết nối..." : "Kết nối Google"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
