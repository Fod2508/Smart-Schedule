import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  ExternalLink,
  Loader2,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { exportScheduleToNewSpreadsheet, readScheduleFromSpreadsheet } from '../services/sheetsApi';

interface SheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleItem[];
  currentDate?: Date;
  accessToken: string | null;
  onImportItems: (items: Partial<ScheduleItem>[]) => void;
  onConnectGoogle: () => void;
}

export const SheetsModal: React.FC<SheetsModalProps> = ({
  isOpen,
  onClose,
  events,
  currentDate,
  accessToken,
  onImportItems,
  onConnectGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'templates'>('export');
  const [exportScope, setExportScope] = useState<'week' | 'all'>('week');
  const [exportLayout, setExportLayout] = useState<'both' | 'timetable_grid' | 'detailed_list'>('both');
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(() => currentDate || new Date());
  const [sheetTitle, setSheetTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const [importSheetId, setImportSheetId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Đồng bộ selectedWeekDate khi mở modal hoặc khi currentDate thay đổi
  useEffect(() => {
    if (currentDate && isOpen) {
      setSelectedWeekDate(new Date(currentDate));
    }
  }, [currentDate, isOpen]);

  // Tính ngày Thứ Hai (00:00:00) và Chủ Nhật (23:59:59.999) của tuần đang chọn
  const { monday, sunday } = useMemo(() => {
    const d = new Date(selectedWeekDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const m = new Date(d.setDate(diff));
    m.setHours(0, 0, 0, 0);
    const s = new Date(m);
    s.setDate(m.getDate() + 6);
    s.setHours(23, 59, 59, 999);
    return { monday: m, sunday: s };
  }, [selectedWeekDate]);

  // Lọc sự kiện theo tuần được chọn
  const weekEvents = useMemo(() => {
    const startMs = monday.getTime();
    const endMs = sunday.getTime();
    return events
      .filter((e) => {
        const t = new Date(e.startTime).getTime();
        return t >= startMs && t <= endMs;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, monday, sunday]);

  const formatShortDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const formatFullDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  // Tự động cập nhật tiêu đề theo phạm vi và thời gian được chọn
  useEffect(() => {
    if (exportScope === 'week') {
      setSheetTitle(
        `Thời khóa biểu Smart Schedule - Tuần ${formatShortDate(monday)} đến ${formatShortDate(sunday)} (${sunday.getFullYear()})`
      );
    } else {
      setSheetTitle(
        `Thời khóa biểu Smart Schedule - Toàn bộ sự kiện (${formatFullDate(new Date())})`
      );
    }
  }, [exportScope, monday, sunday, events.length]);

  const handlePrevWeek = () => {
    setSelectedWeekDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setSelectedWeekDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleCurrentWeek = () => {
    setSelectedWeekDate(new Date());
  };

  const isAuthError = (msg: string | null) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes('invalid authentication credentials') ||
      lower.includes('oauth 2 access token') ||
      lower.includes('401') ||
      lower.includes('unauthenticated') ||
      lower.includes('login cookie') ||
      lower.includes('hết hạn')
    );
  };

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!accessToken) {
      onConnectGoogle();
      return;
    }

    const targetEvents = exportScope === 'week' ? weekEvents : events;
    if (targetEvents.length === 0) {
      setErrorMsg(
        exportScope === 'week'
          ? `Tuần từ ${formatShortDate(monday)} đến ${formatShortDate(sunday)} chưa có sự kiện nào. Hãy đổi sang tuần khác hoặc chọn 'Tất cả sự kiện'.`
          : 'Hiện tại chưa có sự kiện nào trong lịch để xuất.'
      );
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);
    try {
      const res = await exportScheduleToNewSpreadsheet(
        accessToken,
        sheetTitle,
        targetEvents,
        {
          layout: exportLayout,
          weekRange: { monday, sunday },
        }
      );
      setExportUrl(res.spreadsheetUrl);
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi khi xuất Google Sheet');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!accessToken) {
      onConnectGoogle();
      return;
    }
    if (!importSheetId.trim()) return;

    // extract spreadsheetId if full URL was pasted
    let id = importSheetId.trim();
    if (id.includes('/spreadsheets/d/')) {
      const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) id = match[1];
    }

    setIsImporting(true);
    setErrorMsg(null);
    try {
      const items = await readScheduleFromSpreadsheet(accessToken, id);
      onImportItems(items);
      setImportSuccessCount(items.length);
    } catch (e: any) {
      setErrorMsg(e.message || 'Không thể đọc dữ liệu từ Google Sheet. Vui lòng kiểm tra quyền chia sẻ.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateTemplate = async (type: 'student' | 'teacher') => {
    if (!accessToken) {
      onConnectGoogle();
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);
    const title =
      type === 'student'
        ? `[Mẫu Thời Khóa Biểu Sinh Viên] - Học kỳ mới`
        : `[Mẫu Lịch Giảng Dạy & Chấm Bài] - Giáo Viên`;

    const sampleItems: ScheduleItem[] =
      type === 'student'
        ? [
            {
              id: 's1',
              title: 'Toán Rời Rạc',
              description: 'Phòng B204 - Giảng viên TS. Nguyễn Văn A',
              startTime: '2026-09-29T08:00:00',
              endTime: '2026-09-29T10:00:00',
              category: 'study',
              priority: 'high',
              pomodoroBlocks: 2,
            },
            {
              id: 's2',
              title: 'Lập Trình Web Nâng Cao',
              description: 'Thực hành Lab 3',
              startTime: '2026-09-30T13:30:00',
              endTime: '2026-09-30T16:00:00',
              category: 'study',
              priority: 'high',
              pomodoroBlocks: 3,
            },
          ]
        : [
            {
              id: 't1',
              title: 'Dạy Lớp 10A2 - Hình học',
              description: 'Tiết 1-2 phòng 102',
              startTime: '2026-09-29T07:15:00',
              endTime: '2026-09-29T08:45:00',
              category: 'work',
              priority: 'high',
              hasMeet: true,
            },
            {
              id: 't2',
              title: 'Chấm bài kiểm tra giữa kỳ 10A1',
              description: '45 bài',
              startTime: '2026-09-29T14:00:00',
              endTime: '2026-09-29T16:00:00',
              category: 'work',
              priority: 'medium',
              pomodoroBlocks: 2,
            },
          ];

    try {
      const res = await exportScheduleToNewSpreadsheet(accessToken, title, sampleItems);
      setExportUrl(res.spreadsheetUrl);
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi khi tạo Google Sheet template');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Tích hợp Google Sheets
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Xuất file chia sẻ hoặc nhập môn học từ file bảng tính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 flex border-b border-zinc-100 dark:border-zinc-800 gap-4 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('export');
              setErrorMsg(null);
            }}
            className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Download className="w-4 h-4" /> Xuất ra Google Sheets
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setErrorMsg(null);
            }}
            className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Upload className="w-4 h-4" /> Nhập từ Google Sheets
          </button>
          <button
            onClick={() => {
              setActiveTab('templates');
              setErrorMsg(null);
            }}
            className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'templates'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Mẫu có sẵn
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Cảnh báo chưa kết nối Google */}
          {!accessToken && (
            <div className="p-3.5 rounded-2xl bg-amber-50 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Phiên kết nối Google đã hết hạn hoặc chưa được kết nối.</span>
              </div>
              <button
                type="button"
                onClick={onConnectGoogle}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition cursor-pointer"
              >
                Kết nối lại
              </button>
            </div>
          )}

          {/* Banner báo lỗi thông minh */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1">
                  {isAuthError(errorMsg) ? (
                    <div>
                      <p className="font-bold">Phiên kết nối Google đã hết hạn (60 phút).</p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Theo cơ chế bảo mật của Google OAuth, phiên làm việc chỉ có hiệu lực 1 giờ. Vui lòng bấm nút bên dưới để gia hạn kết nối ngay trong 1 giây mà không bị mất dữ liệu.
                      </p>
                    </div>
                  ) : (
                    <span>{errorMsg}</span>
                  )}
                </div>
              </div>

              {isAuthError(errorMsg) && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    onConnectGoogle();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gia hạn & Kết nối lại Google ngay</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Lựa chọn phạm vi xuất: Theo tuần vs Tất cả */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Phạm vi xuất lịch trình
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExportScope('week')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      exportScope === 'week'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Xuất theo tuần (Khuyên dùng)</span>
                    </div>
                    <span className="text-[11px] opacity-75">
                      Chỉ xuất {weekEvents.length} sự kiện trong tuần được chọn
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope('all')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      exportScope === 'all'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Toàn bộ sự kiện</span>
                    </div>
                    <span className="text-[11px] opacity-75">
                      Xuất toàn bộ {events.length} sự kiện hiện có
                    </span>
                  </button>
                </div>
              </div>

              {/* Điều khiển chuyển tuần khi chọn xuất theo tuần */}
              {exportScope === 'week' && (
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                    title="Tuần trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="text-center flex-1">
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                      Tuần: {formatShortDate(monday)} - {formatShortDate(sunday)} ({sunday.getFullYear()})
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {weekEvents.length} sự kiện
                      </span>
                      <span>trong tuần này</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCurrentWeek}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 transition cursor-pointer"
                      title="Chuyển về tuần hiện tại"
                    >
                      Hiện tại
                    </button>
                    <button
                      type="button"
                      onClick={handleNextWeek}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                      title="Tuần sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lựa chọn kiểu bố cục bảng tính */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Bố cục hiển thị trong Google Sheets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportLayout('both')}
                    className={`p-2.5 rounded-2xl border text-left transition flex flex-col gap-0.5 cursor-pointer ${
                      exportLayout === 'both'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1">
                      ✨ Cả 2 dạng
                    </span>
                    <span className="text-[10px] opacity-75">
                      Lưới tuần + Bảng chi tiết
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportLayout('timetable_grid')}
                    className={`p-2.5 rounded-2xl border text-left transition flex flex-col gap-0.5 cursor-pointer ${
                      exportLayout === 'timetable_grid'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1">
                      📅 Lưới lịch tuần
                    </span>
                    <span className="text-[10px] opacity-75">
                      Thứ 2 - CN & Giờ dọc
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportLayout('detailed_list')}
                    className={`p-2.5 rounded-2xl border text-left transition flex flex-col gap-0.5 cursor-pointer ${
                      exportLayout === 'detailed_list'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1">
                      📋 Bảng danh sách
                    </span>
                    <span className="text-[10px] opacity-75">
                      Dữ liệu theo từng dòng
                    </span>
                  </button>
                </div>
              </div>

              {/* Tiêu đề bảng tính */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tiêu đề bảng tính Google Sheets
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-emerald-500"
                />
              </div>

              {/* Mô tả chi tiết dữ liệu sẽ xuất */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                {exportLayout === 'timetable_grid' ? (
                  <span>
                    Sẽ xuất dưới dạng <strong>Lưới thời khóa biểu</strong>: Các cột ngang là Thứ 2 đến Chủ nhật, cột dọc là khung giờ (06:00 - 22:00) và các công việc được điền trực tiếp vào ô ngày & giờ tương ứng.
                  </span>
                ) : exportLayout === 'both' ? (
                  <span>
                    Bảng tính Google Sheets sẽ có <strong>2 trang tính (Tabs)</strong>: Tab 1 là <strong>Lịch tuần dạng lưới (Thứ 2 - CN)</strong> xếp công việc theo giờ, Tab 2 là <strong>Danh sách chi tiết</strong> để tiện tra cứu & lọc.
                  </span>
                ) : (
                  <span>
                    Sẽ xuất dưới dạng <strong>Bảng danh sách chi tiết</strong>: Mỗi hàng là một sự kiện với đầy đủ ngày giờ, môn học, Meet link và ghi chú.
                  </span>
                )}
              </div>

              {/* Nút thực thi */}
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                <span>
                  {isExporting
                    ? 'Đang tạo bảng tính Google Sheets...'
                    : exportScope === 'week'
                      ? `Tạo và Xuất lịch tuần (${weekEvents.length} sự kiện)`
                      : `Tạo và Xuất toàn bộ (${events.length} sự kiện)`}
                </span>
              </button>

              {/* Kết quả xuất thành công */}
              {exportUrl && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã tạo Google Sheet thành công!</span>
                  </div>
                  <a
                    href={exportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                  >
                    <span>Mở Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Đường dẫn (Link) hoặc ID bảng tính Google Sheets
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={importSheetId}
                  onChange={(e) => setImportSheetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                Ứng dụng sẽ tự động đọc các hàng trong Sheet1 (Cột A: Môn học/Nhiệm vụ, Cột F: Google Meet Link, Cột H: Ghi chú) và thêm vào danh sách môn học của bạn.
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !importSheetId.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{isImporting ? 'Đang đọc dữ liệu...' : 'Đọc và Nhập Lịch Trình'}</span>
              </button>

              {importSuccessCount !== null && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã nhập thành công {importSuccessCount} hoạt động vào lịch!</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Tạo nhanh bảng tính theo mẫu chuẩn:
              </span>

              <div
                onClick={() => handleGenerateTemplate('student')}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Mẫu Thời Khóa Biểu Sinh Viên
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Môn học, số tín chỉ, phòng học, giảng viên, link Meet bài tập
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg">
                  Tạo mẫu
                </button>
              </div>

              <div
                onClick={() => handleGenerateTemplate('teacher')}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Mẫu Lịch Giảng Dạy & Chấm Bài Cho Giáo Viên
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Lớp dạy, tiết dạy, sĩ số, chấm thi, link phòng họp Meet tổ chuyên môn
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg">
                  Tạo mẫu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
