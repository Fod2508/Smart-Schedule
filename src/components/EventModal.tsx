import React, { useState, useEffect } from "react";
import {
  X,
  Video,
  Clock,
  Calendar,
  AlertTriangle,
  Trash2,
  Check,
  Sparkles,
  Coffee,
  Bookmark,
  FastForward,
  MapPin,
  Car,
  Navigation,
  BookOpen,
  Briefcase,
  Users,
  Heart,
} from "lucide-react";
import {
  ScheduleItem,
  EventCategory,
  PriorityLevel,
  TransitMode,
  UiTheme,
} from "../types/schedule";

interface EventModalProps {
  isOpen: boolean;
  event: Partial<ScheduleItem> | null;
  onClose: () => void;
  onSave: (event: Partial<ScheduleItem>) => void;
  onDelete?: (eventId: string) => void;
  onOpenRescheduleForEvent?: (eventId: string) => void;
  hasGoogleConnected: boolean;
  uiTheme?: UiTheme;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSave,
  onDelete,
  onOpenRescheduleForEvent,
  hasGoogleConnected,
  uiTheme = "cute",
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("study");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [location, setLocation] = useState("");
  const [hasMeet, setHasMeet] = useState(false);
  const [meetLink, setMeetLink] = useState("");
  const [pomodoroBlocks, setPomodoroBlocks] = useState(1);
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [addTravelBuffer, setAddTravelBuffer] = useState(false);
  const [bufferMinutes, setBufferMinutes] = useState(25);
  const [transitMode, setTransitMode] = useState<TransitMode>("motorcycle");

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setCategory(event.category || "study");
      setPriority(event.priority || "medium");
      setLocation(event.location || "");
      setHasMeet(event.hasMeet || false);
      setMeetLink(event.meetLink || "");
      setPomodoroBlocks(event.pomodoroBlocks || 1);
      setSyncToGoogle(event.isSyncedToGoogle !== false);
      setReminderMinutes((event as any).reminderMinutes || 30);
      setAddTravelBuffer(!!event.bufferMinutes);
      setBufferMinutes(event.bufferMinutes || 25);
      setTransitMode(event.transitMode || "motorcycle");

      const start = event.startTime ? new Date(event.startTime) : new Date();
      const end = event.endTime
        ? new Date(event.endTime)
        : new Date(Date.now() + 60 * 60 * 1000);

      // Dùng local date để tránh lỗi timezone UTC vs local (UTC+7)
      const toLocalDateStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      setStartDate(toLocalDateStr(start));
      setStartTime(
        `${start.getHours().toString().padStart(2, "0")}:${start
          .getMinutes()
          .toString()
          .padStart(2, "0")}`,
      );
      setEndDate(toLocalDateStr(end));
      setEndTime(
        `${end.getHours().toString().padStart(2, "0")}:${end
          .getMinutes()
          .toString()
          .padStart(2, "0")}`,
      );
    } else {
      // Default new event
      const now = new Date();
      const toLocalDateStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setTitle("");
      setDescription("");
      setCategory("study");
      setPriority("medium");
      setLocation("");
      setHasMeet(false);
      setMeetLink("");
      setPomodoroBlocks(1);
      setSyncToGoogle(true);
      setReminderMinutes(30);
      setAddTravelBuffer(false);
      setBufferMinutes(25);
      setTransitMode("motorcycle");
      setStartDate(toLocalDateStr(now));
      setStartTime("08:00");
      setEndDate(toLocalDateStr(now));
      setEndTime("09:30");
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startISO = `${startDate}T${startTime}:00`;
    const endISO = `${endDate}T${endTime}:00`;

    onSave({
      ...(event?.id ? { id: event.id } : {}),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      location: location.trim() || undefined,
      startTime: startISO,
      endTime: endISO,
      hasMeet,
      meetLink: hasMeet ? meetLink.trim() || undefined : undefined,
      pomodoroBlocks,
      isSyncedToGoogle: hasGoogleConnected && syncToGoogle,
      googleEventId: event?.googleEventId,
      googleCalendarId: event?.googleCalendarId,
      source: event?.source,
      reminderMinutes:
        hasGoogleConnected && syncToGoogle ? reminderMinutes : undefined,
      bufferMinutes: addTravelBuffer ? bufferMinutes : undefined,
      transitMode: addTravelBuffer ? transitMode : undefined,
    });
    // onClose() không cần gọi ở đây — App.tsx handleSaveEvent tự đóng modal sau khi async hoàn tất
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {event?.id
                  ? "Chỉnh sửa sự kiện"
                  : "Thêm sự kiện / Lịch học mới"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tự động đồng bộ với Google Calendar & Google Meet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Tiêu đề hoạt động / Môn học *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Toán Giải Tích 2, Họp Sprint Team..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* 3D Visual Category Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>🎨</span> Phân loại hoạt động
              </span>
              <span className="text-[10px] font-normal text-zinc-400">
                Chọn danh mục phù hợp
              </span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: "study", label: "Học tập", img: "/illustrations/badge_study.jpg", vectorIcon: BookOpen, color: "text-violet-500 bg-violet-50 dark:bg-violet-950/40" },
                { id: "work", label: "Công việc", img: "/illustrations/badge_work.jpg", vectorIcon: Briefcase, color: "text-sky-500 bg-sky-50 dark:bg-sky-950/40" },
                { id: "meeting", label: "Cuộc họp", img: "/illustrations/badge_meeting.jpg", vectorIcon: Users, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" },
                { id: "break", label: "Nghỉ ngơi", img: "/illustrations/badge_break.jpg", vectorIcon: Coffee, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40" },
                { id: "personal", label: "Cá nhân", img: "/illustrations/badge_personal.jpg", vectorIcon: Heart, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/40" },
              ].map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as EventCategory)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                      uiTheme === "cute" ? "squishy-pop" : ""
                    } ${
                      isSelected
                        ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/50 shadow-sm scale-[1.03]"
                        : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 opacity-75 hover:opacity-100"
                    }`}
                  >
                    {uiTheme === "cute" ? (
                      <img
                        src={cat.img}
                        alt={cat.label}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-2xs border border-white/90 dark:border-zinc-700/80 mb-1.5 transition-transform ${
                          isSelected ? "scale-110 shadow-xs" : ""
                        }`}
                      />
                    ) : (
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1.5 ${cat.color} ${
                        isSelected ? "ring-1 ring-indigo-500" : ""
                      }`}>
                        <cat.vectorIcon className="w-5 h-5" />
                      </div>
                    )}
                    <span
                      className={`text-[11px] font-bold truncate max-w-full ${
                        isSelected
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority selector with 3 tactile buttons */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Mức độ ưu tiên
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "high", label: "🔥 Ưu tiên cao", active: "bg-rose-500 text-white ring-rose-400" },
                { id: "medium", label: "⚡ Trung bình", active: "bg-indigo-600 text-white ring-indigo-400" },
                { id: "low", label: "🌿 Thấp", active: "bg-emerald-600 text-white ring-emerald-400" },
              ].map((p) => {
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as PriorityLevel)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer squishy-pop text-center ${
                      isSelected
                        ? `${p.active} shadow-xs ring-2 ring-offset-1 dark:ring-offset-zinc-900`
                        : "bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Địa điểm học / làm việc (Offline)
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: ĐH Bách Khoa (Q.10), Cơ quan Quận 1, The Coffee House..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
              />
              <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Travel Buffer Option */}
          <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Đệm di chuyển & Chuẩn bị
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Tự động chèn khối thời gian đi đường trước sự kiện để tránh
                    trễ giờ
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={addTravelBuffer}
                  onChange={(e) => setAddTravelBuffer(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {addTravelBuffer && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-zinc-600 dark:text-zinc-400 block mb-1">
                    Thời gian đệm dự phòng
                  </label>
                  <select
                    value={bufferMinutes}
                    onChange={(e) =>
                      setBufferMinutes(parseInt(e.target.value, 10))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium"
                  >
                    <option value={15}>15 phút (gần / cùng quận)</option>
                    <option value={20}>20 phút (chuẩn nội thành)</option>
                    <option value={30}>
                      30 phút (qua 1-2 quận / giờ tan tầm)
                    </option>
                    <option value={45}>
                      45 phút (xa / kẹt xe nghiêm trọng)
                    </option>
                    <option value={60}>60 phút (ngoại thành / xa)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-600 dark:text-zinc-400 block mb-1">
                    Phương tiện di chuyển
                  </label>
                  <select
                    value={transitMode}
                    onChange={(e) =>
                      setTransitMode(e.target.value as TransitMode)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium"
                  >
                    <option value="motorcycle">🛵 Xe máy (Nhanh)</option>
                    <option value="car">🚗 Ô tô / Taxi (Cần đệm kẹt xe)</option>
                    <option value="transit">🚌 Xe buýt / Công cộng</option>
                    <option value="walking">🚶 Đi bộ</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Time Picker */}
          <div className="space-y-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Khung giờ thực
              hiện
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-zinc-500 dark:text-zinc-400">
                  Bắt đầu
                </label>
                <div className="flex gap-1 mt-1">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-500 dark:text-zinc-400">
                  Kết thúc
                </label>
                <div className="flex gap-1 mt-1">
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Google Meet Option */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Google Meet trực tuyến
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Tự động sinh link phòng học/họp và nhắc trước 10 phút
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasMeet}
                onChange={(e) => setHasMeet(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {hasMeet && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Link Google Meet tùy chọn (để trống nếu muốn tạo tự động)
              </label>
              <input
                type="url"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs"
              />
            </div>
          )}

          {/* Pomodoro Integration */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Ước lượng Pomodoro
                </span>
                <p className="text-[11px] text-zinc-500">
                  Mỗi block = 25 phút tập trung sâu
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPomodoroBlocks(Math.max(1, pomodoroBlocks - 1))
                }
                className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold"
              >
                -
              </button>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 w-6 text-center">
                {pomodoroBlocks}
              </span>
              <button
                type="button"
                onClick={() => setPomodoroBlocks(pomodoroBlocks + 1)}
                className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Ghi chú / Mô tả chi tiết
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung bài học, tài liệu cần chuẩn bị..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Google Sync toggle + Reminder */}
          {hasGoogleConnected && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  id="syncToGoogle"
                  checked={syncToGoogle}
                  onChange={(e) => setSyncToGoogle(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="syncToGoogle" className="cursor-pointer">
                  Đồng bộ trực tiếp lên Google Calendar
                </label>
              </div>

              {/* Reminder picker — chỉ hiện khi sync được bật */}
              {syncToGoogle && (
                <div className="ml-5 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    🔔 Nhắc trước:
                  </span>
                  {[10, 15, 30, 60, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setReminderMinutes(mins)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                        reminderMinutes === mins
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      }`}
                    >
                      {mins < 60 ? `${mins}p` : `${mins / 60}h`}
                    </button>
                  ))}
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    → Google gửi email & notification điện thoại
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {event?.id && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(event.id!)}
                  className="px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}

              {event?.id && onOpenRescheduleForEvent && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRescheduleForEvent(event.id!);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Báo việc này bị kéo dài hoặc trễ giờ để AI tự động sắp xếp lại các lịch tiếp theo"
                >
                  <FastForward className="w-3.5 h-3.5 text-amber-600" />
                  <span>Trễ việc này (Dời lịch AI)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
