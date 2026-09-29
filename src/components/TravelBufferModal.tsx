import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Navigation,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Sliders,
  Check,
  Info,
} from 'lucide-react';
import {
  ScheduleItem,
  TransitMode,
  TravelConflictWarning,
  TravelScanResult,
} from '../types/schedule';
import { analyzeTravelBuffersWithAI } from '../services/aiService';

interface TravelBufferModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleItem[];
  onApplyBuffers: (newEvents: ScheduleItem[]) => void;
}

export const TravelBufferModal: React.FC<TravelBufferModalProps> = ({
  isOpen,
  onClose,
  events,
  onApplyBuffers,
}) => {
  const [transitMode, setTransitMode] = useState<TransitMode>('motorcycle');
  const [defaultBufferMinutes, setDefaultBufferMinutes] = useState(25);
  const [autoShiftHazards, setAutoShiftHazards] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<TravelScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  // Existing travel buffer events currently on schedule
  const existingBuffers = events.filter((e) => e.isTravelBuffer);

  useEffect(() => {
    if (isOpen) {
      handleScan();
    }
  }, [isOpen, transitMode, defaultBufferMinutes]);

  if (!isOpen) return null;

  const handleScan = async () => {
    setIsLoading(true);
    setError(null);
    setIsApplied(false);
    try {
      const res = await analyzeTravelBuffersWithAI(events, transitMode, defaultBufferMinutes);
      setScanResult(res);
    } catch (err: any) {
      console.error('Error scanning travel buffers:', err);
      setError(err.message || 'Lỗi khi quét thời gian di chuyển');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoInsertAllBuffers = () => {
    if (!scanResult || scanResult.suggestedBuffers.length === 0) return;

    let updatedEvents = [...events];

    scanResult.suggestedBuffers.forEach((buf, idx) => {
      // Find target event and potential previous event
      const targetIdx = updatedEvents.findIndex((e) => e.id === buf.targetEventId);
      let bufStart = new Date(buf.startTime);
      let bufEnd = new Date(buf.endTime);

      if (autoShiftHazards && targetIdx !== -1) {
        const targetEv = updatedEvents[targetIdx];
        const targetStart = new Date(targetEv.startTime);
        const targetDuration = new Date(targetEv.endTime).getTime() - targetStart.getTime();

        // Check if there is a previous event ending right before targetStart
        const prevEv = updatedEvents.find((e) => {
          if (e.id === targetEv.id || e.isTravelBuffer) return false;
          const eEnd = new Date(e.endTime);
          return Math.abs(targetStart.getTime() - eEnd.getTime()) <= 30 * 60 * 1000;
        });

        if (prevEv) {
          const prevEnd = new Date(prevEv.endTime);
          // Set buffer starting at prevEnd
          bufStart = prevEnd;
          bufEnd = new Date(bufStart.getTime() + buf.bufferMinutes * 60 * 1000);
          // Shift target event to start at bufEnd
          const newTargetStart = bufEnd;
          const newTargetEnd = new Date(newTargetStart.getTime() + targetDuration);

          updatedEvents[targetIdx] = {
            ...targetEv,
            startTime: newTargetStart.toISOString(),
            endTime: newTargetEnd.toISOString(),
          };
        }
      }

      // Create new travel buffer event item
      const bufferEvent: ScheduleItem = {
        id: `travel-buf-${Date.now()}-${idx}`,
        title: `🚗 Di chuyển: ${buf.origin} ➔ ${buf.destination}`,
        description: `Thời gian đệm di chuyển & chuẩn bị (${buf.bufferMinutes} phút) bằng ${
          buf.transitMode === 'motorcycle'
            ? 'xe máy'
            : buf.transitMode === 'car'
            ? 'ô tô'
            : buf.transitMode === 'transit'
            ? 'xe buýt'
            : 'đi bộ'
        }. ${buf.note}`,
        startTime: bufStart.toISOString(),
        endTime: bufEnd.toISOString(),
        category: 'break',
        priority: 'high',
        isTravelBuffer: true,
        bufferForEventId: buf.targetEventId,
        travelOrigin: buf.origin,
        travelDestination: buf.destination,
        transitMode: buf.transitMode,
        bufferMinutes: buf.bufferMinutes,
        color: '#f59e0b',
      };

      updatedEvents.push(bufferEvent);
    });

    onApplyBuffers(updatedEvents);
    setIsApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleInsertSingleBufferForHazard = (hazardId: string) => {
    if (!scanResult) return;
    const hazard = scanResult.hazards.find((h) => h.id === hazardId);
    if (!hazard) return;

    const nextId = hazard.nextEventId || hazard.nextEvent?.id || '';
    const nextTitle = hazard.nextTitle || hazard.nextEvent?.title || 'Sự kiện kế tiếp';
    const prevId = hazard.previousEventId || hazard.previousEvent?.id || '';

    const buf = scanResult.suggestedBuffers.find((b) => b.targetEventId === nextId) || {
      targetEventId: nextId,
      targetTitle: nextTitle,
      bufferMinutes: hazard.recommendedBufferMinutes,
      startTime: '',
      endTime: '',
      origin: hazard.originLocation,
      destination: hazard.destinationLocation,
      transitMode,
      note: hazard.estimatedTrafficNote || '',
    };

    let updatedEvents = [...events];
    const targetIdx = updatedEvents.findIndex((e) => e.id === nextId);
    const prevIdx = updatedEvents.findIndex((e) => e.id === prevId);

    let bufStart: Date;
    let bufEnd: Date;

    if (prevIdx !== -1 && targetIdx !== -1) {
      const prevEv = updatedEvents[prevIdx];
      const targetEv = updatedEvents[targetIdx];
      const targetDuration = new Date(targetEv.endTime).getTime() - new Date(targetEv.startTime).getTime();

      bufStart = new Date(prevEv.endTime);
      bufEnd = new Date(bufStart.getTime() + hazard.recommendedBufferMinutes * 60 * 1000);

      if (autoShiftHazards) {
        updatedEvents[targetIdx] = {
          ...targetEv,
          startTime: bufEnd.toISOString(),
          endTime: new Date(bufEnd.getTime() + targetDuration).toISOString(),
        };
      }
    } else {
      bufStart = new Date();
      bufEnd = new Date(bufStart.getTime() + hazard.recommendedBufferMinutes * 60 * 1000);
    }

    const bufferEvent: ScheduleItem = {
      id: `travel-buf-${Date.now()}`,
      title: `🚗 Di chuyển: ${hazard.originLocation} ➔ ${hazard.destinationLocation}`,
      description: `Thời gian đệm di chuyển & chuẩn bị (${hazard.recommendedBufferMinutes} phút). ${hazard.estimatedTrafficNote || ''}`,
      startTime: bufStart.toISOString(),
      endTime: bufEnd.toISOString(),
      category: 'break',
      priority: 'high',
      isTravelBuffer: true,
      bufferForEventId: nextId,
      travelOrigin: hazard.originLocation,
      travelDestination: hazard.destinationLocation,
      transitMode,
      bufferMinutes: hazard.recommendedBufferMinutes,
      color: '#f59e0b',
    };

    updatedEvents.push(bufferEvent);
    onApplyBuffers(updatedEvents);
  };

  const handleRemoveExistingBuffer = (bufferId: string) => {
    const updated = events.filter((e) => e.id !== bufferId);
    onApplyBuffers(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25 shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  Tự động Chèn Đệm Di Chuyển & Chuẩn Bị
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Navigation className="w-3.5 h-3.5" />
                  Travel Buffer
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Tránh đặt 2 lịch offline liền nhau mà không tính thời gian kẹt xe ngoài đường.
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
          {/* Transit Preferences bar */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-500" />
                Cấu hình phương tiện & thời gian đệm mặc định
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1.5">
                  Phương tiện di chuyển chính:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'motorcycle', label: '🛵 Xe máy', desc: 'Luồn lách nhanh' },
                    { id: 'car', label: '🚗 Ô tô / Taxi', desc: 'Dễ kẹt xe' },
                    { id: 'transit', label: '🚌 Xe buýt', desc: 'Đợi trạm' },
                    { id: 'walking', label: '🚶 Đi bộ', desc: 'Khoảng cách gần' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTransitMode(mode.id as TransitMode)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        transitMode === mode.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-400'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="text-xs">{mode.label}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1.5">
                  Thời gian đệm dự phòng tối thiểu:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[15, 20, 25, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDefaultBufferMinutes(mins)}
                      className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        defaultBufferMinutes === mins
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {mins} phút
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  * Hệ thống sẽ tự động chèn khối thời gian {defaultBufferMinutes}p trước sự kiện offline để bạn kịp di chuyển.
                </p>
              </div>
            </div>

            {/* Smart Auto-Shift Toggle */}
            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoShiftCheck"
                  checked={autoShiftHazards}
                  onChange={(e) => setAutoShiftHazards(e.target.checked)}
                  className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="autoShiftCheck" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  Tự động dời lịch sự kiện kế tiếp nếu không đủ thời gian đệm (Tránh trùng giờ)
                </label>
              </div>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">
                Khuyên dùng cho các sự kiện offline liên tiếp
              </span>
            </div>
          </div>

          {/* Hazards & Conflict Warnings */}
          {isLoading && (
            <div className="text-center py-10 space-y-2">
              <Sparkles className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                AI đang quét các địa điểm và tính toán khoảng cách di chuyển...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && scanResult && (
            <div className="space-y-4">
              {/* Summary card */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  scanResult.hazards.length > 0
                    ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {scanResult.hazards.length > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block text-sm">
                      {scanResult.hazards.length > 0
                        ? `Phát hiện ${scanResult.hazards.length} khoảng chuyển tiếp di chuyển gấp rút!`
                        : 'Lịch trình di chuyển an toàn'}
                    </span>
                    <span className="text-[11px] opacity-90">{scanResult.summary}</span>
                  </div>
                </div>

                {scanResult.suggestedBuffers.length > 0 && (
                  <button
                    onClick={handleAutoInsertAllBuffers}
                    disabled={isApplied}
                    className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isApplied
                        ? 'bg-emerald-600'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã chèn xong!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Chèn {scanResult.suggestedBuffers.length} đệm di chuyển</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* List of Travel Hazards */}
              {scanResult.hazards.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Chi tiết các sự kiện offline liên tiếp cần xử lý
                  </span>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {scanResult.hazards.map((hazard) => (
                      <div
                        key={hazard.id}
                        className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-zinc-800/60 text-xs shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                            <span>{hazard.previousTitle || hazard.previousEvent?.title || 'Sự kiện trước'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-rose-500" />
                            <span>{hazard.nextTitle || hazard.nextEvent?.title || 'Sự kiện sau'}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                            Khoảng trống: {hazard.actualGapMinutes} phút
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-400" /> Từ: <strong>{hazard.originLocation}</strong>
                          </span>
                          <span>➔</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500" /> Đến: <strong>{hazard.destinationLocation}</strong>
                          </span>
                        </div>

                        <p className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40">
                          ⚠️ {hazard.estimatedTrafficNote}
                        </p>

                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleInsertSingleBufferForHazard(hazard.id)}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Chèn {hazard.recommendedBufferMinutes}p đệm cho cặp này</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Travel Buffers on Schedule */}
              {existingBuffers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Các khối đệm di chuyển đang có trên lịch ({existingBuffers.length})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {existingBuffers.map((buf) => {
                      const start = new Date(buf.startTime);
                      const end = new Date(buf.endTime);
                      const timeStr = `${start.toLocaleDateString('vi-VN', {
                        weekday: 'short',
                      })}, ${start.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} - ${end.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`;

                      return (
                        <div
                          key={buf.id}
                          className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-amber-600 shrink-0" />
                            <div>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                                {buf.title}
                              </span>
                              <span className="text-[10px] text-zinc-500">{timeStr}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveExistingBuffer(buf.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                            title="Xóa khối đệm di chuyển này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
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

          {scanResult && scanResult.suggestedBuffers.length > 0 && (
            <button
              type="button"
              onClick={handleAutoInsertAllBuffers}
              disabled={isApplied}
              className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                isApplied
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
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
                  <span>Áp dụng tất cả đệm di chuyển ({scanResult.suggestedBuffers.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
