import React, { useState } from 'react';
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
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { exportScheduleToNewSpreadsheet, readScheduleFromSpreadsheet } from '../services/sheetsApi';

interface SheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleItem[];
  accessToken: string | null;
  onImportItems: (items: Partial<ScheduleItem>[]) => void;
  onConnectGoogle: () => void;
}

export const SheetsModal: React.FC<SheetsModalProps> = ({
  isOpen,
  onClose,
  events,
  accessToken,
  onImportItems,
  onConnectGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'templates'>('export');
  const [sheetTitle, setSheetTitle] = useState(
    `Thời khóa biểu Smart Schedule - ${new Date().toLocaleDateString('vi-VN')}`
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const [importSheetId, setImportSheetId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!accessToken) {
      onConnectGoogle();
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);
    try {
      const res = await exportScheduleToNewSpreadsheet(accessToken, sheetTitle, events);
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
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
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
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 flex border-b border-zinc-100 dark:border-zinc-800 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Download className="w-4 h-4" /> Xuất ra Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Upload className="w-4 h-4" /> Nhập từ Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('templates')}
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
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tiêu đề bảng tính Google Sheets
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                Sẽ xuất toàn bộ <span className="font-bold text-zinc-900 dark:text-zinc-100">{events.length}</span> sự kiện và môn học hiện có, được định dạng chuyên nghiệp với các cột: Môn/Hoạt động, Thời gian bắt đầu, Kết thúc, Google Meet, Pomodoro và Ghi chú.
              </div>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                <span>{isExporting ? 'Đang tạo bảng tính...' : 'Tạo và Xuất ra Google Sheets'}</span>
              </button>

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
