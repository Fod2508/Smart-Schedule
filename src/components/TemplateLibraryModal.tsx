import React from 'react';
import {
  X,
  FolderOpen,
  GraduationCap,
  BookOpen,
  Briefcase,
  Users,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TEMPLATE_LIBRARY } from '../data/templateLibrary';
import { TemplateData, ScheduleItem } from '../types/schedule';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateData) => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const iconMap: Record<string, React.ReactNode> = {
    GraduationCap: <GraduationCap className="w-5 h-5" />,
    BookOpen: <BookOpen className="w-5 h-5" />,
    Briefcase: <Briefcase className="w-5 h-5" />,
    Users: <Users className="w-5 h-5" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Thư Viện Mẫu Thời Khóa Biểu Chuẩn
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Lựa chọn template chuyên biệt cho Sinh viên, Giáo viên, Freelancer và Team
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

        {/* Content list */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {TEMPLATE_LIBRARY.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-indigo-400 dark:hover:border-indigo-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-2xs group-hover:scale-105 transition-transform">
                  {iconMap[tpl.icon] || <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {tpl.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                      {tpl.persona}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-2 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Bao gồm {tpl.items.length} block hoạt động chuẩn</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTemplate(tpl);
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Áp dụng mẫu này</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
