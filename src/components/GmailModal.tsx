import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { generateEmailSummaryWithAI, EmailSummaryResult } from '../services/aiService';
import { sendScheduleEmail } from '../services/gmailApi';

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleItem[];
  userEmail: string;
  userName: string;
  accessToken: string | null;
  onConnectGoogle: () => void;
  onRequestConfirmSend: (onConfirm: () => Promise<void>, details: string) => void;
}

export const GmailModal: React.FC<GmailModalProps> = ({
  isOpen,
  onClose,
  events,
  userEmail,
  userName,
  accessToken,
  onConnectGoogle,
  onRequestConfirmSend,
}) => {
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const [recipient, setRecipient] = useState(userEmail || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailData, setEmailData] = useState<EmailSummaryResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setIsSent(false);

    try {
      const filteredEvents =
        period === 'today'
          ? events.filter((e) => {
              const d = new Date(e.startTime);
              const now = new Date();
              return d.toDateString() === now.toDateString();
            })
          : events;

      const res = await generateEmailSummaryWithAI(
        filteredEvents.length > 0 ? filteredEvents : events,
        period,
        userName || 'Bạn'
      );
      setEmailData(res);
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi khi soạn email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    if (!accessToken) {
      onConnectGoogle();
      return;
    }
    if (!recipient.trim() || !emailData) return;

    // Mandatory user confirmation per Workspace Integration skill
    onRequestConfirmSend(async () => {
      setIsSending(true);
      try {
        await sendScheduleEmail(
          accessToken,
          recipient.trim(),
          emailData.subject,
          emailData.htmlBody
        );
        setIsSent(true);
      } catch (e: any) {
        setErrorMsg(e.message || 'Lỗi khi gửi email qua Gmail');
      } finally {
        setIsSending(false);
      }
    }, `Gửi email tổng hợp lịch trình "${emailData.subject}" đến hộp thư ${recipient.trim()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Tổng hợp lịch & Gửi qua Gmail
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gemini AI soạn thảo email thông báo lịch trình hàng ngày/hàng tuần gửi đến hòm thư
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Period selector & Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kỳ tổng hợp
              </label>
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPeriod('today')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                    period === 'today'
                      ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Lịch Hôm Nay
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('week')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                    period === 'week'
                      ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Lịch Toàn Tuần
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Email người nhận
              </label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs"
              />
            </div>
          </div>

          {/* Generate button */}
          {!emailData && (
            <div className="py-6 text-center space-y-3">
              <p className="text-xs text-zinc-500">
                Nhấp vào nút bên dưới để Gemini AI đọc {events.length} sự kiện và tự động tạo email tóm tắt hoàn chỉnh kèm link Google Meet và các việc cần ưu tiên.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'AI đang soạn thảo email...' : 'Soạn Email với Gemini AI'}</span>
              </button>
            </div>
          )}

          {/* Email Preview */}
          {emailData && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tiêu đề email (Subject)
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Bản xem trước nội dung email (HTML)
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Soạn lại
                  </button>
                </div>

                <div
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 max-h-56 overflow-y-auto prose dark:prose-invert prose-xs"
                  dangerouslySetInnerHTML={{ __html: emailData.htmlBody }}
                />
              </div>

              {isSent && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Email đã được gửi thành công qua tài khoản Gmail của bạn!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !recipient.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isSending ? 'Đang gửi qua Gmail...' : 'Gửi Ngay'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
