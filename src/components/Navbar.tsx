import React from 'react';
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
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserPersona } from '../types/schedule';

interface NavbarProps {
  user: User | null;
  hasWorkspaceToken: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  persona: UserPersona;
  onPersonaChange: (p: UserPersona) => void;
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
  persona,
  onPersonaChange,
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
  const personaLabels: Record<UserPersona, { label: string; desc: string }> = {
    student: { label: 'Sinh viên', desc: 'Học tập + Tự học + CLB' },
    teacher: { label: 'Giáo viên', desc: 'Giảng dạy + Chấm bài + Họp' },
    freelancer: { label: 'Freelancer', desc: 'Nhiều project song song' },
    team: { label: 'Team / Nhóm', desc: 'Giờ họp chung + Sprint' },
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Smart Schedule
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Gemini AI
                </span>
              </div>
              <p className="hidden md:block text-xs text-zinc-500 dark:text-zinc-400">
                Trợ lý xếp thời khóa biểu thông minh & Google Workspace
              </p>
            </div>
          </div>

          {/* Persona Selector */}
          <div className="hidden lg:flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
            {(['student', 'teacher', 'freelancer', 'team'] as UserPersona[]).map((p) => {
              const active = persona === p;
              return (
                <button
                  key={p}
                  onClick={() => onPersonaChange(p)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    active
                      ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                  title={personaLabels[p].desc}
                >
                  {personaLabels[p].label}
                </button>
              );
            })}
          </div>

          {/* Action Tools & Integration buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Conflict warning pill */}
            {conflictCount > 0 && (
              <button
                onClick={onOpenConflicts}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl transition animate-pulse"
                title={`${conflictCount} xung đột lịch cần giải quyết`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Trùng lịch</span>
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px]">
                  {conflictCount}
                </span>
              </button>
            )}

            {/* Quét ảnh OCR button */}
            <button
              onClick={onOpenOcrScanner}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200/80 dark:border-violet-800/80 flex items-center gap-1.5 transition cursor-pointer"
              title="Quét thời khóa biểu từ ảnh hoặc PDF (Gemini Multimodal OCR)"
            >
              <Camera className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="hidden sm:inline">Quét ảnh TKB</span>
            </button>

            {/* Team Meeting Finder & Poll */}
            <button
              onClick={onOpenTeamMeeting}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1.5 transition cursor-pointer"
              title="Tìm giờ trống chung cho team & tạo bảng khảo sát (Meeting Poll)"
            >
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Giờ họp Team</span>
            </button>

            {/* Smart Auto-Reschedule when delayed */}
            <button
              onClick={onOpenReschedule}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1.5 transition cursor-pointer"
              title="AI Dời lịch thông minh khi bị trễ việc (Smart Auto-Reschedule)"
            >
              <FastForward className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Dời lịch trễ</span>
            </button>

            {/* AI Energy Matcher (Xếp lịch theo nhịp sinh học) */}
            <button
              onClick={onOpenEnergyMatcher}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/80 dark:border-orange-800/80 flex items-center gap-1.5 transition cursor-pointer"
              title="AI Xếp lịch theo Năng lượng sinh học (AI Energy-to-Task Matcher)"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="hidden lg:inline">Năng lượng AI</span>
            </button>

            {/* Travel Buffer (Đệm di chuyển & chuẩn bị) */}
            {onOpenTravelBuffer && (
              <button
                onClick={onOpenTravelBuffer}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1.5 transition cursor-pointer"
                title="Tự động chèn đệm di chuyển & chuẩn bị (Travel Buffer)"
              >
                <Car className="w-4 h-4 text-amber-500" />
                <span className="hidden xl:inline">Đệm di chuyển</span>
              </button>
            )}

            {/* Pomodoro Timer button */}
            <button
              onClick={onOpenPomodoro}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1.5 transition"
              title="Đồng hồ Pomodoro"
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">Pomodoro</span>
            </button>

            {/* Google Tasks button */}
            <button
              onClick={onOpenTasks}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1.5 transition"
              title="Google Tasks & Deadline"
            >
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">Tasks</span>
            </button>

            {/* Google Sheets */}
            <button
              onClick={onOpenSheets}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1.5 transition"
              title="Import/Export Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden xl:inline">Sheets</span>
            </button>

            {/* Gmail Digest */}
            <button
              onClick={onOpenGmail}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1.5 transition"
              title="Gửi tổng hợp lịch qua Gmail"
            >
              <Mail className="w-4 h-4 text-rose-500" />
              <span className="hidden xl:inline">Gmail</span>
            </button>

            {/* Template Library */}
            <button
              onClick={onOpenTemplates}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1.5 transition"
              title="Mẫu thời khóa biểu có sẵn"
            >
              <FolderOpen className="w-4 h-4 text-indigo-500" />
              <span className="hidden xl:inline">Mẫu</span>
            </button>

            {/* Analytics */}
            <button
              onClick={onOpenAnalytics}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1.5 transition"
              title="Thống kê năng suất & AI Auto-balance"
            >
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="hidden md:inline">Thống kê</span>
            </button>

            {/* Online / Offline Status Badge */}
            <div
              className={`p-2 rounded-xl text-xs flex items-center gap-1 ${
                isOnline
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
              }`}
              title={isOnline ? 'Đang trực tuyến' : 'Chế độ ngoại tuyến (Offline mode)'}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Chuyển chế độ sáng tối"
              title="Chuyển chế độ sáng/tối"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Google Authentication Section */}
            {user && hasWorkspaceToken ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2" title={user.email || ''}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-8 h-8 rounded-full border border-indigo-300 dark:border-indigo-600"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden 2xl:inline text-xs font-medium text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Official Google Sign-in button format per guidelines */
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-xs transition cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
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
                <span>{isLoggingIn ? 'Đang kết nối...' : 'Kết nối Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
