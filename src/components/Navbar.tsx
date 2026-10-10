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
  LayoutGrid,
  Search,
  Check,
  RefreshCw,
} from "lucide-react";
import { User } from "firebase/auth";
import { UiTheme } from "../types/schedule";
import { AppLogo } from "./AppLogo";

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
  onOpenCommandPalette?: () => void;
  isOnline: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  uiTheme: UiTheme;
  onToggleUiTheme: (theme: UiTheme) => void;
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
  onOpenCommandPalette,
  isOnline,
  isDarkMode,
  onToggleDarkMode,
  uiTheme,
  onToggleUiTheme,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const themesList: { id: UiTheme; label: string; icon: string }[] = [
    {
      id: "cute",
      label: "Dễ thương",
      icon: "🎀",
    },
    {
      id: "capybara",
      label: "Capybara",
      icon: "🦫",
    },
    {
      id: "yohan",
      label: "Go Yohan",
      icon: "👓",
    },
    {
      id: "minimal",
      label: "Tối giản",
      icon: "💼",
    },
  ];

  const currentThemeObj =
    themesList.find((t) => t.id === uiTheme) || themesList[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setIsWorkspaceOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
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
          {/* Fixed Application Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <AppLogo className="w-8 h-8" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight hidden sm:block">
                Smart Schedule
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded-md border border-indigo-200 dark:border-indigo-800">
                AI
              </span>
            </div>
          </div>

          {/* Center tool buttons */}
          <div className="flex items-center gap-1.5 flex-1 justify-center max-w-2xl">
            {/* Quick Command / Search trigger */}
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition group cursor-pointer mr-1 btn-3d-neutral"
                title="Mở thanh lệnh thông minh (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-500 transition-colors" />
                <span className="hidden md:inline">Tìm kiếm & Lệnh AI</span>
                <span className="md:hidden">Lệnh</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xs">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Conflict badge */}
            {conflictCount > 0 && (
              <button
                onClick={onOpenConflicts}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-2xl transition animate-pulse mr-0.5 cursor-pointer btn-3d-neutral"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trùng</span>
                <span className="px-1.5 bg-rose-600 text-white rounded-full text-[10px] leading-5">
                  {conflictCount}
                </span>
              </button>
            )}

            {/* Pomodoro */}
            <button
              onClick={onOpenPomodoro}
              title="Pomodoro Timer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-zinc-600 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 transition cursor-pointer btn-3d-neutral"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Pomodoro</span>
            </button>

            {/* Analytics */}
            <button
              onClick={onOpenAnalytics}
              title="Thống kê & Tối ưu hóa lịch trình"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition cursor-pointer btn-3d-neutral"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden md:inline">Thống kê</span>
            </button>

            {/* Templates */}
            <button
              onClick={onOpenTemplates}
              title="Thư viện mẫu thời khóa biểu"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold border border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer btn-3d-neutral"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden lg:inline">Mẫu</span>
            </button>

            {/* Google Workspace Dropdown */}
            <div className="relative" ref={workspaceRef}>
              <button
                onClick={() => setIsWorkspaceOpen((v) => !v)}
                title="Google Workspace (Tasks, Sheets, Gmail)"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold transition cursor-pointer border btn-3d-neutral ${
                  isWorkspaceOpen
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                    : "border-zinc-200/70 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60 hover:border-emerald-300 dark:hover:border-emerald-700 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Workspace</span>
                {hasWorkspaceToken && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Đã kết nối Google" />
                )}
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${isWorkspaceOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isWorkspaceOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                      Google Workspace
                    </span>
                    {hasWorkspaceToken && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Đã kết nối
                      </span>
                    )}
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onOpenTasks();
                        setIsWorkspaceOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition group cursor-pointer"
                    >
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                        <CheckSquare className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          Google Tasks
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          Đồng bộ việc cần làm với lịch
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onOpenSheets();
                        setIsWorkspaceOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition group cursor-pointer"
                    >
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          Google Sheets
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          Xuất / Nhập thời khóa biểu
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onOpenGmail();
                        setIsWorkspaceOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition group cursor-pointer"
                    >
                      <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500 shrink-0">
                        <Mail className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-500 dark:group-hover:text-rose-400">
                          Gmail Digest
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          Gửi email tóm tắt lịch trình
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5 hidden sm:block" />

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

            {/* Theme Dropdown Selector */}
            <div className="relative" ref={themeMenuRef}>
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 transition cursor-pointer shadow-2xs btn-3d-neutral mr-1"
                title="Chọn giao diện (Theme)"
              >
                <span>{currentThemeObj.icon}</span>
                <span className="hidden sm:inline">{currentThemeObj.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    isThemeMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/90 dark:border-zinc-800 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/80">
                    Giao diện
                  </div>
                  <div className="py-1">
                    {themesList.map((t) => {
                      const isSelected = uiTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onToggleUiTheme(t.id);
                            setIsThemeMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-zinc-100/90 dark:bg-zinc-800 font-bold text-zinc-900 dark:text-zinc-100"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{t.icon}</span>
                            <span className="text-xs">{t.label}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title={isDarkMode ? "Chuyển sang giao diện Sáng (Light mode)" : "Chuyển sang giao diện Tối (Dark mode)"}
              aria-label="Chuyển sáng/tối"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-zinc-200 dark:border-zinc-700 ml-1">
                <div className="relative">
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
                  {/* Status indicator: green = Workspace active, amber = needs renewal */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                      hasWorkspaceToken ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                    title={
                      hasWorkspaceToken
                        ? "Google Workspace đã kết nối (Calendar, Tasks, Sheets)"
                        : "Phiên kết nối Google Calendar hết hạn (1h). Bấm Gia hạn để nối lại ngay."
                    }
                  />
                </div>

                {!hasWorkspaceToken && (
                  <button
                    type="button"
                    onClick={() => onLogin()}
                    disabled={isLoggingIn}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-[11px] font-semibold transition cursor-pointer disabled:opacity-60"
                    title="Phiên kết nối Google Workspace hết hạn sau 1 giờ. Bấm để kết nối lại nhanh chỉ với 1 click"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoggingIn ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">
                      {isLoggingIn ? "Đang nối..." : "Gia hạn"}
                    </span>
                  </button>
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
                onClick={() => onLogin()}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 btn-3d-neutral transition cursor-pointer disabled:opacity-60 ml-1"
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
