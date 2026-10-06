import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Calendar, Mail, CheckCircle2 } from "lucide-react";

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-10">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Schedule</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chính sách quyền riêng tư (Privacy Policy)
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Trang chủ
          </Link>
        </div>

        {/* Meta details */}
        <div className="my-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex flex-wrap justify-between gap-2">
          <span><strong>Ngày hiệu lực:</strong> 06/10/2026</span>
          <span><strong>Nhà phát triển:</strong> Smart Schedule Team</span>
          <span><strong>Email hỗ trợ:</strong> <a href="mailto:satanp050@gmail.com" className="text-indigo-600 dark:text-indigo-400 underline">satanp050@gmail.com</a></span>
        </div>

        {/* Commitment Highlight */}
        <div className="mb-8 p-5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed text-indigo-950 dark:text-indigo-200">
              <strong>Cam kết bảo mật cốt lõi:</strong> Smart Schedule tuyệt đối tôn trọng quyền riêng tư của bạn. Dữ liệu Google Calendar và tài khoản Google của bạn chỉ được sử dụng để hiển thị, sắp xếp và đồng bộ lịch trình theo yêu cầu của bạn. Chúng tôi <strong>không bao giờ</strong> bán thông tin, không chia sẻ với bên thứ ba cho mục đích quảng cáo và không sử dụng dữ liệu ngoài mục đích phục vụ tính năng ứng dụng.
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block"></span>
              1. Giới thiệu về Smart Schedule
            </h2>
            <p>
              <strong>Smart Schedule</strong> là ứng dụng quản lý thời khóa biểu và lịch trình học tập, làm việc thông minh, tích hợp đồng bộ hai chiều với Google Calendar và Google Tasks. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn khi sử dụng ứng dụng tại website <a href="https://smart-schedule-em7h.onrender.com" className="text-indigo-600 dark:text-indigo-400 underline">https://smart-schedule-em7h.onrender.com</a>.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block"></span>
              2. Dữ liệu chúng tôi thu thập và Mục đích sử dụng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Dữ liệu Google Calendar & Tasks
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Đọc và tạo sự kiện lịch học tập, cuộc hẹn, nhắc nhở để hiển thị trên lưới thời khóa biểu và đồng bộ với Google Calendar của bạn.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  Thông tin hồ sơ Google (Profile)
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Địa chỉ email, tên hiển thị và ảnh đại diện phục vụ mục đích xác thực tài khoản đăng nhập an toàn qua Google Firebase Auth.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Google Policy Compliance */}
          <section className="p-5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
            <h2 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              3. Tuân thủ Chính sách Dữ liệu Người dùng Google API (Limited Use Policy)
            </h2>
            <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-300 italic mb-2">
              "Smart Schedule's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google API Services User Data Policy</a>, including the Limited Use requirements."
            </p>
            <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-400">
              Ứng dụng cam kết chỉ yêu cầu các quyền phạm vi (scopes) tối thiểu cần thiết để phục vụ chức năng xếp lịch và đồng bộ lịch, không dùng dữ liệu Google cho bất kỳ mục đích đào tạo AI không minh bạch hoặc thương mại hóa nào.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block"></span>
              4. Chia sẻ và Bảo mật thông tin
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Không bán dữ liệu:</strong> Chúng tôi cam đoan không bán, trao đổi hoặc phân phối thông tin của bạn cho các bên quảng cáo thứ ba.</li>
              <li><strong>Mã hóa bảo vệ:</strong> Mọi kết nối truyền tải dữ liệu đều được bảo vệ bằng giao thức mã hóa HTTPS/TLS tiêu chuẩn cao cấp.</li>
              <li><strong>Không lưu mật khẩu:</strong> Ứng dụng không bao giờ yêu cầu hoặc lưu trữ mật khẩu tài khoản Google của bạn.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block"></span>
              5. Quyền kiểm soát & Xóa dữ liệu của bạn (Data Deletion)
            </h2>
            <p className="mb-2">Bạn hoàn toàn có quyền kiểm soát và xóa dữ liệu của mình bất cứ lúc nào:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Thu hồi quyền truy cập:</strong> Bạn có thể ngắt kết nối Smart Schedule với Google bất kỳ lúc nào tại:{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 underline font-medium"
                >
                  https://myaccount.google.com/permissions
                </a>
              </li>
              <li>
                <strong>Yêu cầu xóa toàn bộ dữ liệu:</strong> Để yêu cầu xóa sạch toàn bộ lịch trình và thông tin liên kết khỏi hệ thống, bạn chỉ cần gửi yêu cầu qua email tới:{" "}
                <a href="mailto:satanp050@gmail.com" className="text-indigo-600 dark:text-indigo-400 underline font-medium">
                  satanp050@gmail.com
                </a>. Chúng tôi sẽ phản hồi và hoàn tất xóa trong vòng 48 giờ.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block"></span>
              6. Thông tin liên hệ
            </h2>
            <p className="text-sm">
              Nếu bạn có câu hỏi hoặc đóng góp về Chính sách quyền riêng tư này, vui lòng liên hệ với nhà phát triển qua:
            </p>
            <div className="mt-2 text-sm bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div><strong>Ứng dụng:</strong> Smart Schedule</div>
              <div><strong>Email:</strong> <a href="mailto:satanp050@gmail.com" className="text-indigo-600 dark:text-indigo-400 underline">satanp050@gmail.com</a></div>
              <div><strong>Website:</strong> <a href="https://smart-schedule-em7h.onrender.com" className="text-indigo-600 dark:text-indigo-400 underline">https://smart-schedule-em7h.onrender.com</a></div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
          © 2026 Smart Schedule. All rights reserved.
        </div>

      </div>
    </div>
  );
};
export default PrivacyPolicyPage;
