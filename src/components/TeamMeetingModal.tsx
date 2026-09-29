import React, { useState } from 'react';
import {
  X,
  Users,
  Sparkles,
  Clock,
  Calendar,
  Check,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Video,
  ThumbsUp,
  HelpCircle,
  ThumbsDown,
  Share2,
  Loader2,
  Vote,
  ExternalLink,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import {
  findTeamSlotsWithAI,
  TeamCandidateSlot,
  TeamSlotFinderResult,
} from '../services/aiService';

interface TeamMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvents: ScheduleItem[];
  weekStart: string;
  onScheduleMeeting: (meeting: Partial<ScheduleItem>, attendees: string[]) => void;
}

export const TeamMeetingModal: React.FC<TeamMeetingModalProps> = ({
  isOpen,
  onClose,
  currentEvents,
  weekStart,
  onScheduleMeeting,
}) => {
  const [meetingTitle, setMeetingTitle] = useState('Họp Sprint Review & Kế hoạch tuần');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [attendees, setAttendees] = useState<string[]>([
    'Trưởng nhóm',
    'Thành viên dev',
    'Design lead',
  ]);
  const [newAttendeeInput, setNewAttendeeInput] = useState('');
  const [memberConstraints, setMemberConstraints] = useState(
    'Tránh giờ ăn trưa (11:30 - 13:30), ưu tiên buổi sáng thứ 3 hoặc chiều thứ 4, tránh sau 17:00'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TeamSlotFinderResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'finder' | 'poll'>('finder');
  const [copiedPoll, setCopiedPoll] = useState(false);

  // Poll votes state: slotId -> { yes: string[], maybe: string[], no: string[] }
  const [votesState, setVotesState] = useState<Record<string, { yes: number; maybe: number; no: number }>>({});
  const [userVotedSlot, setUserVotedSlot] = useState<Record<string, 'yes' | 'maybe' | 'no' | null>>({});

  if (!isOpen) return null;

  const handleAddAttendee = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = newAttendeeInput.trim();
    if (val && !attendees.includes(val)) {
      setAttendees([...attendees, val]);
      setNewAttendeeInput('');
    }
  };

  const handleRemoveAttendee = (name: string) => {
    setAttendees(attendees.filter((a) => a !== name));
  };

  const handleFindSlots = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await findTeamSlotsWithAI(
        meetingTitle.trim(),
        durationMinutes,
        attendees,
        currentEvents,
        memberConstraints.trim(),
        weekStart
      );
      setResult(res);

      // Initialize votes state
      const initialVotes: Record<string, { yes: number; maybe: number; no: number }> = {};
      res.candidateSlots.forEach((slot, index) => {
        initialVotes[slot.id] = {
          yes: slot.recommended ? attendees.length - 1 : Math.max(1, attendees.length - 2),
          maybe: 1,
          no: index === 2 ? 1 : 0,
        };
      });
      setVotesState(initialVotes);
    } catch (err: any) {
      console.error('Error finding team slots:', err);
      setErrorMsg(err.message || 'Lỗi khi tìm giờ họp chung cho nhóm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = (slotId: string, type: 'yes' | 'maybe' | 'no') => {
    const currentVote = userVotedSlot[slotId];
    if (currentVote === type) return;

    setUserVotedSlot((prev) => ({ ...prev, [slotId]: type }));
    setVotesState((prev) => {
      const current = prev[slotId] || { yes: 0, maybe: 0, no: 0 };
      const updated = { ...current };

      if (currentVote) {
        updated[currentVote] = Math.max(0, updated[currentVote] - 1);
      }
      updated[type] = updated[type] + 1;
      return { ...prev, [slotId]: updated };
    });
  };

  const handleConfirmSlot = (slot: TeamCandidateSlot) => {
    onScheduleMeeting(
      {
        title: meetingTitle,
        description: `Cuộc họp nhóm với: ${attendees.join(', ')}.\nĐược chọn bởi Smart Schedule Team Slot Finder.`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        category: 'meeting',
        priority: 'high',
        hasMeet: true,
      },
      attendees
    );
    onClose();
  };

  const handleCopyPollText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.pollSummaryText);
    setCopiedPoll(true);
    setTimeout(() => setCopiedPoll(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Tìm Giờ Trống Chung Cho Team & Khảo Sát
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Team Smart Finder
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gemini AI quét lịch người tổ chức và gợi ý các khung giờ vàng phù hợp với mọi thành viên
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

        {/* Tab switchers if result is available */}
        {result && (
          <div className="px-5 pt-3 flex border-b border-zinc-100 dark:border-zinc-800 gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('finder')}
              className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'finder'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Đề xuất của AI ({result.candidateSlots.length} khung giờ)
            </button>
            <button
              onClick={() => setActiveTab('poll')}
              className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'poll'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Vote className="w-4 h-4" /> Bảng Khảo Sát & Bình Chọn
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Form setup if no result OR on first view */}
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tiêu đề cuộc họp *
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="VD: Họp Sprint Review, Đồng bộ đồ án..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Thời lượng dự kiến
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  <option value={15}>15 phút (Quick Sync)</option>
                  <option value={30}>30 phút</option>
                  <option value={45}>45 phút</option>
                  <option value={60}>60 phút (1 tiếng)</option>
                  <option value={90}>90 phút (1.5 tiếng)</option>
                  <option value={120}>120 phút (2 tiếng)</option>
                </select>
              </div>
            </div>

            {/* Attendees tag list */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Thành viên tham gia ({attendees.length})
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 min-h-[42px] items-center">
                {attendees.map((att, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 shadow-2xs"
                  >
                    <span>{att}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(att)}
                      className="text-zinc-400 hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <form onSubmit={handleAddAttendee} className="inline-flex items-center flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={newAttendeeInput}
                    onChange={(e) => setNewAttendeeInput(e.target.value)}
                    placeholder="Thêm tên hoặc email..."
                    className="w-full bg-transparent px-2 py-0.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none placeholder-zinc-400"
                  />
                </form>
              </div>
            </div>

            {/* Member constraints */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Ràng buộc & Giờ bận của các thành viên (nếu có)
              </label>
              <input
                type="text"
                value={memberConstraints}
                onChange={(e) => setMemberConstraints(e.target.value)}
                placeholder="VD: Nam bận sáng T3, Linh thích chiều T4, tránh sau 17:00..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Run AI button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleFindSlots}
                disabled={isLoading || !meetingTitle.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI đang dò tìm giờ trống...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{result ? 'Quét lại giờ trống' : 'Tìm Giờ Trống Tối Ưu Với AI'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Area */}
          {result && activeTab === 'finder' && (
            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in">
              {/* Reasoning */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Đánh giá từ Gemini AI:</span>
                </div>
                <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {result.reasoning}
                </p>
              </div>

              {/* Candidate Slots Cards */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Các khung giờ vàng được đề xuất ({result.candidateSlots.length} lựa chọn):
                </span>

                {result.candidateSlots.map((slot) => {
                  const start = new Date(slot.startTime);
                  const end = new Date(slot.endTime);
                  const dayStr = start.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                  });
                  const timeStr = `${start.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - ${end.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`;

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        slot.recommended
                          ? 'bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 dark:from-indigo-950/50 dark:via-zinc-900 dark:to-indigo-950/30 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                            {dayStr} • {timeStr}
                          </span>
                          {slot.recommended && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs">
                              ⭐ Đề xuất số 1
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                            {slot.matchScore}% Phù hợp
                          </span>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {slot.suitabilityReason}
                        </p>
                        {slot.pros && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ {slot.pros}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmSlot(slot)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Chốt Giờ Này (Tạo Meet)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Poll Tab */}
          {result && activeTab === 'poll' && (
            <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Bình chọn khung giờ ({attendees.length} thành viên tham gia)
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Bình chọn trực tiếp bên dưới hoặc sao chép nội dung gửi lên group Zalo/Telegram/Slack
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPollText}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedPoll ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPoll ? 'Đã sao chép!' : 'Copy tin nhắn bình chọn'}</span>
                </button>
              </div>

              {/* Poll cards */}
              <div className="space-y-3">
                {result.candidateSlots.map((slot, index) => {
                  const start = new Date(slot.startTime);
                  const end = new Date(slot.endTime);
                  const dayStr = start.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                  });
                  const timeStr = `${start.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - ${end.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`;

                  const votes = votesState[slot.id] || { yes: 0, maybe: 0, no: 0 };
                  const myVote = userVotedSlot[slot.id];
                  const totalVotes = votes.yes + votes.maybe + votes.no;
                  const yesPercent = totalVotes > 0 ? (votes.yes / totalVotes) * 100 : 0;

                  return (
                    <div
                      key={slot.id}
                      className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                              {dayStr} • {timeStr}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 ml-7">
                            {slot.suitabilityReason}
                          </p>
                        </div>

                        {/* Fast commit button */}
                        <button
                          type="button"
                          onClick={() => handleConfirmSlot(slot)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Chốt khung giờ này</span>
                        </button>
                      </div>

                      {/* Vote Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          <span>
                            {votes.yes} người rảnh ({yesPercent.toFixed(0)}%)
                          </span>
                          <span>
                            {votes.maybe} có thể • {votes.no} bận
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex">
                          <div
                            style={{ width: `${(votes.yes / Math.max(1, totalVotes)) * 100}%` }}
                            className="bg-emerald-500 h-full"
                          />
                          <div
                            style={{ width: `${(votes.maybe / Math.max(1, totalVotes)) * 100}%` }}
                            className="bg-amber-400 h-full"
                          />
                          <div
                            style={{ width: `${(votes.no / Math.max(1, totalVotes)) * 100}%` }}
                            className="bg-rose-400 h-full"
                          />
                        </div>
                      </div>

                      {/* Voting Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                        <span className="text-[11px] font-medium text-zinc-500">Ý kiến của bạn:</span>

                        <button
                          type="button"
                          onClick={() => handleVote(slot.id, 'yes')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            myVote === 'yes'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Rảnh</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVote(slot.id, 'maybe')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            myVote === 'maybe'
                              ? 'bg-amber-500 text-white'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Có thể</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVote(slot.id, 'no')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            myVote === 'no'
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>Bận</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
