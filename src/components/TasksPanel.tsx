import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { GoogleTaskItem } from '../types/schedule';

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: GoogleTaskItem[];
  taskLists: { id: string; title: string }[];
  selectedListId: string;
  onSelectTaskList: (id: string) => void;
  onScheduleTaskToSlot: (task: GoogleTaskItem) => void;
  onAddNewTask: (title: string, due?: string) => Promise<void>;
  onCompleteTask: (task: GoogleTaskItem) => Promise<void>;
  isLoading: boolean;
  hasGoogleConnected: boolean;
  onConnectGoogle: () => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({
  isOpen,
  onClose,
  tasks,
  taskLists,
  selectedListId,
  onSelectTaskList,
  onScheduleTaskToSlot,
  onAddNewTask,
  onCompleteTask,
  isLoading,
  hasGoogleConnected,
  onConnectGoogle,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddNewTask(newTitle.trim(), newDue ? `${newDue}T23:59:59.000Z` : undefined);
      setNewTitle('');
      setNewDue('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Google Tasks & Deadline
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Chuyển task thành block thời gian trong lịch tuần chỉ với 1 cú nhấp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!hasGoogleConnected ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Chưa kết nối Google Tasks
            </h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Đăng nhập bằng tài khoản Google để tự động đồng bộ công việc và deadline từ Google Tasks vào thời khóa biểu thông minh.
            </p>
            <button
              onClick={onConnectGoogle}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Kết nối Google Ngay
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Task list filter */}
            {taskLists.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-zinc-400 text-[11px] font-medium shrink-0">Danh sách:</span>
                {taskLists.map((tl) => (
                  <button
                    key={tl.id}
                    onClick={() => onSelectTaskList(tl.id)}
                    className={`px-3 py-1 rounded-lg font-medium shrink-0 transition ${
                      selectedListId === tl.id
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    {tl.title}
                  </button>
                ))}
              </div>
            )}

            {/* Quick add task input */}
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm nhiệm vụ / bài tập mới..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
              />
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="px-2 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
                title="Hạn chót (Deadline)"
              />
              <button
                type="submit"
                disabled={!newTitle.trim() || isSubmitting}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Thêm</span>
              </button>
            </form>

            {/* Task list */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span>Đang đồng bộ từ Google Tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                Không có công việc nào còn dang dở trong danh sách này 🎉
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const dueDate = task.due ? new Date(task.due) : null;
                  const isOverdue = dueDate && dueDate.getTime() < Date.now();

                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 hover:border-emerald-200 dark:hover:border-emerald-900 transition"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => onCompleteTask(task)}
                          className="mt-0.5 text-zinc-400 hover:text-emerald-600 transition"
                          title="Hoàn thành task"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                              {task.notes}
                            </p>
                          )}
                          {dueDate && (
                            <div className="flex items-center gap-1 text-[10px] mt-1 font-medium">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              <span className={isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'}>
                                Deadline: {dueDate.toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Schedule into calendar button */}
                      <button
                        onClick={() => onScheduleTaskToSlot(task)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center gap-1 shrink-0 transition"
                        title="Tự động xếp task này vào khung giờ trống tiếp theo"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Xếp vào lịch</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
