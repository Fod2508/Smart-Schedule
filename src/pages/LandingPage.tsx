import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Sparkles,
  Zap,
  Car,
  Users,
  BarChart3,
  Clock,
  CheckSquare,
  ArrowRight,
  Star,
  Shield,
  Smartphone,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-indigo-500" />,
      title: "Xếp lịch bằng ngôn ngữ tự nhiên",
      desc: 'Chỉ cần gõ "Xếp cho tôi 3 buổi học Toán mỗi tuần" — Gemini AI sẽ tự động phân bổ thời gian hợp lý.',
      color: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Tối ưu theo nhịp sinh học",
      desc: "AI xếp việc khó vào giờ minh mẫn nhất, việc nhẹ vào giờ năng lượng thấp — dựa trên chronotype của bạn.",
      color: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      icon: <Car className="w-6 h-6 text-orange-500" />,
      title: "Tự động chèn thời gian di chuyển",
      desc: "Phát hiện 2 lịch liền nhau khác địa điểm và tự chèn khoảng đệm di chuyển để bạn không bao giờ bị trễ.",
      color: "bg-orange-50 dark:bg-orange-950/40",
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-500" />,
      title: "Tìm giờ họp chung cho nhóm",
      desc: "AI phân tích lịch của cả team và đề xuất các khung giờ phù hợp nhất, kèm link bình chọn.",
      color: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-500" />,
      title: "Thống kê năng suất",
      desc: "Phân tích điểm năng suất tuần, gợi ý cải thiện và tối ưu hóa lịch trình tự động.",
      color: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      icon: <Clock className="w-6 h-6 text-rose-500" />,
      title: "Xử lý trễ việc thông minh",
      desc: "Bị kẹt xe hay họp kéo dài? AI tự động sắp xếp lại các việc còn lại để không bị chồng chéo.",
      color: "bg-rose-50 dark:bg-rose-950/40",
    },
  ];

  const integrations = [
    { name: "Google Calendar", icon: "📅", desc: "Sync 2 chiều realtime" },
    { name: "Google Tasks", icon: "✅", desc: "Quản lý task trong lịch" },
    { name: "Google Sheets", icon: "📊", desc: "Xuất/nhập thời khóa biểu" },
    { name: "Gmail", icon: "✉️", desc: "Nhắc nhở qua email" },
    { name: "Google Meet", icon: "🎥", desc: "Tạo link họp tự động" },
    { name: "Firebase", icon: "🔥", desc: "Đồng bộ đa thiết bị" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-zinc-50">
              Smart Schedule
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/tutorial")}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
            >
              Hướng dẫn
            </button>
            <button
              onClick={() => navigate("/app")}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition flex items-center gap-1.5"
            >
              Dùng ngay <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/60 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini AI
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight mb-6">
          Thời khóa biểu thông minh
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            xếp bằng tiếng Việt
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Không cần drag-and-drop phức tạp. Chỉ cần nói điều bạn muốn — AI sẽ tự
          động xếp lịch, tối ưu theo nhịp sinh học và đồng bộ với Google
          Calendar của bạn.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/app")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Bắt đầu miễn phí
          </button>
          <button
            onClick={() => navigate("/tutorial")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold text-base transition flex items-center justify-center gap-2"
          >
            Xem hướng dẫn
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            Tất cả trong một công cụ
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            AI không chỉ xếp lịch — mà còn giúp bạn làm việc thông minh hơn mỗi
            ngày.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl ${f.color} border border-zinc-200/60 dark:border-zinc-800`}
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              Cách hoạt động
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Chỉ 3 bước để có lịch trình hoàn hảo
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Nói điều bạn muốn",
                desc: 'Nhập yêu cầu bằng tiếng Việt tự nhiên: "Xếp 3 buổi học Toán, ưu tiên buổi sáng, tránh thứ 6"',
                color: "text-indigo-600",
              },
              {
                step: "02",
                title: "AI phân tích & xếp lịch",
                desc: "Gemini AI đọc lịch hiện có, tránh trùng giờ, cân bằng workload và tối ưu theo nhịp sinh học của bạn",
                color: "text-amber-600",
              },
              {
                step: "03",
                title: "Đồng bộ & nhắc nhở",
                desc: "Lịch tự động sync lên Google Calendar, gửi email nhắc nhở trước 30 phút, dữ liệu lưu trên cloud",
                color: "text-emerald-600",
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className={`text-5xl font-black ${s.color} opacity-20 mb-4`}
                >
                  {s.step}
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-lg">
                  {s.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            Kết nối với hệ sinh thái Google
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Tích hợp sẵn với tất cả công cụ bạn đang dùng
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {item.name}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section className="bg-zinc-50 dark:bg-zinc-900/50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-500" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                Bảo mật dữ liệu
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Dữ liệu mã hóa, chỉ bạn mới xem được lịch của mình
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Smartphone className="w-8 h-8 text-indigo-500" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                Đồng bộ đa thiết bị
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Dùng trên máy tính, điện thoại — lịch luôn cập nhật realtime
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="w-8 h-8 text-amber-500" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                Hoàn toàn miễn phí
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Tất cả tính năng không tốn phí — không cần thẻ tín dụng
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
          Sẵn sàng làm chủ thời gian?
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-lg mx-auto">
          Tham gia ngay và trải nghiệm lịch trình thông minh được xây dựng cho
          người Việt.
        </p>
        <button
          onClick={() => navigate("/app")}
          className="px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] flex items-center gap-2 mx-auto"
        >
          <Sparkles className="w-5 h-5" />
          Bắt đầu ngay — Miễn phí
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span>Smart Schedule © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/tutorial")}
              className="hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            >
              Hướng dẫn
            </button>
            <button
              onClick={() => navigate("/app")}
              className="hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            >
              Ứng dụng
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
