import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  MapPin,
  Video,
  Coffee,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { parseScheduleFromImageOrPdf, OcrScheduleResult } from '../services/aiService';

interface OcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: string;
  onApplyOcrItems: (items: ScheduleItem[], summary: string) => void;
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({
  isOpen,
  onClose,
  weekStart,
  onApplyOcrItems,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<OcrScheduleResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP) hoặc tài liệu PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File quá lớn (tối đa 10MB). Vui lòng chọn file nhỏ hơn.');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScan = async () => {
    if (!previewDataUrl || !selectedFile || isScanning) return;

    setIsScanning(true);
    setErrorMsg(null);

    try {
      const mimeType = selectedFile.type || 'image/jpeg';
      const result = await parseScheduleFromImageOrPdf(
        previewDataUrl,
        mimeType,
        weekStart,
        userNote.trim() || undefined
      );

      setScanResult(result);
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      setErrorMsg(err.message || 'Không thể nhận diện lịch trình từ tài liệu này. Vui lòng thử lại với ảnh rõ nét hơn.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!scanResult || !scanResult.items) return;

    const newItems: ScheduleItem[] = scanResult.items.map((item, idx) => ({
      id: `ocr-${Date.now()}-${idx}`,
      title: item.title,
      description: item.description || '',
      startTime: item.startTime,
      endTime: item.endTime,
      category: item.category,
      priority: item.priority,
      hasMeet: item.hasMeet,
      location: item.location,
      pomodoroBlocks: item.pomodoroBlocks || 2,
      source: 'ai',
      isSyncedToGoogle: false,
    }));

    onApplyOcrItems(newItems, scanResult.summary);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewDataUrl(null);
    setScanResult(null);
    setErrorMsg(null);
    setUserNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Quét Thời Khóa Biểu từ Ảnh / PDF
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-200/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  Gemini Multimodal
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tự động nhận diện môn học, phòng học, thứ và tiết học chuyển thẳng vào lịch tuần
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Zone when no file chosen */}
          {!previewDataUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 dark:hover:border-violet-400 rounded-3xl p-8 text-center cursor-pointer transition bg-zinc-50/50 dark:bg-zinc-800/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-3">
                Kéo thả ảnh hoặc nhấp để tải lên thời khóa biểu
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Hỗ trợ ảnh chụp thời khóa biểu giấy, ảnh chụp màn hình cổng thông tin sinh viên hoặc file PDF lịch học/lịch thi (tối đa 10MB)
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-xs font-semibold text-violet-600 dark:text-violet-300 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                <Camera className="w-3.5 h-3.5" /> Chọn ảnh chụp hoặc file
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File preview and actions */}
              <div className="flex flex-col sm:flex-row gap-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedFile?.type === 'application/pdf' ? (
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  ) : (
                    <img
                      src={previewDataUrl}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {((selectedFile?.size || 0) / 1024).toFixed(0)} KB • {selectedFile?.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition"
                  >
                    Chọn file khác
                  </button>
                  <button
                    type="button"
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI đang đọc ảnh...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Quét & Trích xuất lịch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Optional user note input */}
              {!scanResult && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ghi chú thêm cho AI (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="VD: Chỉ lấy các môn thực hành, hoặc bỏ qua tiết sinh hoạt lớp..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              )}

              {/* Large Image Preview toggle */}
              {selectedFile?.type.startsWith('image/') && !scanResult && (
                <div className="max-h-56 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 flex items-center justify-center">
                  <img
                    src={previewDataUrl}
                    alt="Preview Full"
                    className="max-h-56 w-auto object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Scan Results View */}
          {scanResult && (
            <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-900 dark:text-violet-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Đã nhận diện thành công {scanResult.totalItemsDetected || scanResult.items.length} môn học / sự kiện
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  {scanResult.summary}
                </p>
              </div>

              {/* Extracted items grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Danh sách môn học trích xuất:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {scanResult.items.map((it, idx) => {
                    const start = new Date(it.startTime);
                    const end = new Date(it.endTime);
                    const dayLabel = start.toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    });
                    const timeLabel = `${start.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} - ${end.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs shadow-2xs space-y-1"
                      >
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {it.title}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <Clock className="w-3 h-3 text-violet-500" />
                          <span>{dayLabel} • {timeLabel}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {it.location && (
                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-600">
                              <MapPin className="w-2.5 h-2.5 text-rose-500" /> {it.location}
                            </span>
                          )}
                          {it.hasMeet && (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded font-medium">
                              <Video className="w-2.5 h-2.5" /> Trực tuyến
                            </span>
                          )}
                          {it.pomodoroBlocks && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                              <Coffee className="w-2.5 h-2.5" /> {it.pomodoroBlocks}P
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Quét lại
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Áp dụng vào Thời khóa biểu tuần</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
