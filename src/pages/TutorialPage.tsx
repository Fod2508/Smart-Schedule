import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Car,
  Clock,
  Users,
  Camera,
  BarChart3,
  FastForward,
  CheckSquare,
  Mail,
  FileSpreadsheet,
} from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "Dữ liệu lịch trình của tôi có bị lưu trữ không?",
    a: "Có — dữ liệu được lưu an toàn trên Firebase Firestore của bạn, mã hóa và chỉ tài khoản Google của bạn mới có quyền truy cập. Chúng tôi không đọc hay chia sẻ dữ liệu của bạn.",
  },
  {
    q: "Tôi có cần đăng nhập Google mới dùng được không?",
    a: "Không bắt buộc! Bạn có thể dùng đầy đủ tính năng AI mà không cần đăng nhập. Đăng nhập Google chỉ cần thiết khi muốn đồng bộ với Google Calendar, Tasks, Sheets hoặc nhận email nhắc nhở.",
  },
  {
    q: "Tính năng AI có mất phí không?",
    a: "Hoàn toàn miễn phí. Ứng dụng dùng Gemini AI API với nhiều tài khoản xoay vòng để đảm bảo luôn có sẵn.",
  },
  {
    q: "Lịch có đồng bộ realtime không?",
    a: "Có — khi bạn đăng nhập Google, mọi thay đổi trên lịch trình sẽ được đồng bộ lên Firestore và Google Calendar ngay lập tức.",
  },
  {
    q: "Tôi có thể dùng trên điện thoại không?",
    a: "Được — web app hoạt động tốt trên mobile browser. Bạn có thể thêm vào màn hình chính (Add to Home Screen) để dùng như ứng dụng native.",
  },
];

const tutorials = [
  {
    icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
    title: "Xếp lịch bằng AI",
    steps: [
      'Nhập yêu cầu vào ô AI ở đầu trang, ví dụ: "Xếp cho tôi 3 buổi học Toán mỗi tuần, ưu tiên buổi sáng"',
      "AI sẽ phân tích và đề xuất các khung giờ phù hợp",
      'Xem preview kết quả và bấm "Thêm vào lịch tuần" để áp dụng',
      "Bạn có thể nhập tiếp các yêu cầu khác để bổ sung lịch",
    ],
  },
  {
    icon: <Calendar className="w-5 h-5 text-emerald-500" />,
    title: "Thêm sự kiện thủ công",
    steps: [
      "Bấm vào ô trống trên lịch tuần để tạo sự kiện tại giờ đó",
      "Hoặc bấm vào sự kiện có sẵn để chỉnh sửa",
      "Điền tiêu đề, thời gian, địa điểm, độ ưu tiên",
      'Tick "Đồng bộ Google Calendar" nếu muốn gửi lên Google',
      "Chọn thời gian nhắc nhở qua email (10p, 15p, 30p, 1h, 2h trước)",
    ],
  },
  {
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    title: "Tối ưu theo nhịp sinh học",
    steps: [
      'Bấm nút "AI Tools" → "Tối ưu theo năng lượng"',
      "Chọn chronotype của bạn: Chim Buổi Sáng, Nhịp Cân Bằng, hoặc Cú Đêm",
      'Bấm "Phân tích & tối ưu" — AI sẽ đánh giá từng sự kiện',
      "Xem điểm phù hợp và danh sách sự kiện bị lệch nhịp",
      'Bấm "Áp dụng" để dời các sự kiện vào đúng khung giờ năng lượng',
    ],
  },
  {
    icon: <Car className="w-5 h-5 text-orange-500" />,
    title: "Thêm thời gian di chuyển",
    steps: [
      'Bấm "AI Tools" → "Thêm thời gian di chuyển"',
      "Chọn phương tiện di chuyển (xe máy, ô tô, xe buýt, đi bộ)",
      "Chọn thời gian đệm tối thiểu (15–60 phút)",
      "AI sẽ quét và phát hiện các cặp lịch liền nhau thiếu thời gian di chuyển",
      'Bấm "Áp dụng tất cả" để chèn khoảng đệm tự động',
    ],
  },
  {
    icon: <FastForward className="w-5 h-5 text-rose-500" />,
    title: "Xử lý khi bị trễ việc",
    steps: [
      'Bấm "AI Tools" → "Xử lý trễ việc"',
      "Chọn sự kiện đang bị kéo dài và số phút trễ",
      "Nhập lý do (tùy chọn) để AI hiểu ngữ cảnh",
      "Chọn chiến lược: Ưu tiên thông minh / Đẩy lùi tất cả / Dời sang ngày mai",
      'Bấm "Phân tích" → xem thay đổi → bấm "Áp dụng ngay"',
    ],
  },
  {
    icon: <Camera className="w-5 h-5 text-violet-500" />,
    title: "Quét ảnh thời khóa biểu",
    steps: [
      'Bấm "AI Tools" → "Quét ảnh thời khóa biểu"',
      "Upload ảnh chụp thời khóa biểu trường/công ty (JPG, PNG, PDF)",
      "AI tự động nhận diện môn học, giờ học, phòng học",
      "Xem kết quả trích xuất và điều chỉnh nếu cần",
      'Bấm "Thêm vào lịch" để import tất cả',
    ],
  },
  {
    icon: <Users className="w-5 h-5 text-indigo-500" />,
    title: "Tìm giờ họp chung",
    steps: [
      'Bấm "AI Tools" → "Tìm giờ họp chung"',
      "Nhập tên cuộc họp, thời lượng và danh sách thành viên",
      'Ghi thêm ràng buộc: "An bận sáng thứ 3, Bình không họp sau 17h"',
      "AI đề xuất 3-4 khung giờ tốt nhất với điểm phù hợp",
      "Copy text bình chọn và gửi vào group chat",
    ],
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
    title: "Xem thống kê & tối ưu lịch",
    steps: [
      'Bấm "Lịch trình" trên thanh công cụ',
      "Xem điểm năng suất tuần và các gợi ý cải thiện",
      'Bấm "Tối ưu hóa lịch" để AI tự động điều chỉnh',
      'Xem lịch sau khi tối ưu và bấm "Áp dụng" nếu hài lòng',
    ],
  },
  {
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    title: "Dùng Pomodoro Timer",
    steps: [
      'Bấm nút "Pomodoro" trên thanh công cụ',
      'Hoặc bấm "Bật Pomodoro" trực tiếp từ sự kiện trong TodayWidget',
      "Đặt thời gian tập trung (mặc định 25 phút) và nghỉ (5 phút)",
      "Bấm Play để bắt đầu — có âm thanh thông báo khi hết giờ",
      "Theo dõi số phiên đã hoàn thành trong ngày",
    ],
  },
  {
    icon: <Mail className="w-5 h-5 text-rose-500" />,
    title: "Nhận email nhắc nhở",
    steps: [
      "Đăng nhập Google để kích hoạt tính năng này",
      'Khi tạo/chỉnh sửa sự kiện, tick "Đồng bộ Google Calendar"',
      "Chọn thời gian nhắc trước: 10p, 15p, 30p, 1h, hoặc 2h",
      "Google sẽ tự gửi email và notification đến điện thoại của bạn",
      "Không cần app đang mở — hoạt động ngay cả khi tắt máy tính",
    ],
  },
  {
    icon: <FileSpreadsheet className="w-5 h-5 text-emerald-500" />,
    title: "Xuất/Nhập Google Sheets",
    steps: [
      'Bấm "Sheets" trên thanh công cụ',
      'Tab "Xuất": đặt tên file và bấm "Tạo Google Sheets" — file tự tạo trong Drive',
      'Tab "Nhập": paste link Google Sheets và bấm "Đọc dữ liệu"',
      'Tab "Mẫu": tạo file mẫu cho sinh viên hoặc giáo viên',
    ],
  },
  {
    icon: <CheckSquare className="w-5 h-5 text-emerald-500" />,
    title: "Đồng bộ Google Tasks",
    steps: [
      'Đăng nhập Google và bấm "Tasks" trên thanh công cụ',
      "Xem danh sách task từ Google Tasks của bạn",
      'Bấm "Xếp vào lịch" để AI tự tạo sự kiện cho task đó',
      "Đánh dấu hoàn thành task trực tiếp từ app",
    ],
  },
];

export const TutorialPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-zinc-50">
              Smart Schedule
            </span>
          </button>
          <button
            onClick={() => navigate("/app")}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition flex items-center gap-1.5"
          >
            Dùng ngay <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            Hướng dẫn sử dụng
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Tất cả tính năng được giải thích từng bước — từ cơ bản đến nâng cao.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar navigation */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-20 space-y-1">
              {tutorials.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2.5 transition ${
                    activeSection === i
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  {t.icon}
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {tutorials.map((t, i) => (
              <div
                key={i}
                id={`section-${i}`}
                className={`mb-8 p-6 rounded-3xl border transition-all ${
                  activeSection === i
                    ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                }`}
                onClick={() => setActiveSection(i)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {t.icon}
                  </div>
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
                    {t.title}
                  </h2>
                </div>
                <ol className="space-y-3">
                  {t.steps.map((step, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {j + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </main>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 text-center">
            Câu hỏi thường gặp
          </h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    {faq.q}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA bottom */}
        <div className="mt-16 text-center p-10 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Sẵn sàng thử chưa?
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            Không cần cài đặt, không cần đăng ký — dùng ngay trong trình duyệt.
          </p>
          <button
            onClick={() => navigate("/app")}
            className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/25 transition flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Mở ứng dụng
          </button>
        </div>
      </div>
    </div>
  );
};
