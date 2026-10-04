import React, { useState } from "react";
import confetti from "canvas-confetti";

export const YohanCalendarFrame: React.FC = () => {
  // Speech quotes index states
  const [readingIdx, setReadingIdx] = useState(0);
  const [megaphoneIdx, setMegaphoneIdx] = useState(0);
  const [cheeringIdx, setCheeringIdx] = useState(0);
  const [runningIdx, setRunningIdx] = useState(0);
  const [turtleneckIdx, setTurtleneckIdx] = useState(0);
  const [blushingIdx, setBlushingIdx] = useState(0);
  const [wavingIdx, setWavingIdx] = useState(0);

  const readingQuotes = [
    "Xem lại lịch nào! 📋",
    "Hôm nay có hẹn cà phê không? ☕",
    "Lịch này duyệt rồi nhé! ✨",
    "Cần tôi ghi chú thêm gì không? ✍️",
  ];

  const megaphoneQuotes = [
    "Thông báo: Đừng quên deadline! 📢",
    "Chú ý! Có lịch trình mới nè! ⏰",
    "Alo alo! Go Yohan phát thanh đây! 📣",
    "Tập trung làm việc nào! 💥",
  ];

  const cheeringQuotes = [
    "Cố lên! Bạn làm được mà! ✊",
    "Uống sữa rồi chiến đấu tiếp nào! 🥛",
    "Fighting! Hôm nay tuyệt lắm! ✨",
    "Tôi luôn ủng hộ bạn! 🖤",
  ];

  const runningQuotes = [
    "Muộn giờ rồi, chạy mau! 🏃‍♂️",
    "Đừng để trễ deadline nha! ⚡",
    "Chạy bộ rèn luyện nào! 👟",
    "Theo kịp tôi không? 💨",
  ];

  const turtleneckQuotes = [
    "Hả?! Việc này làm khi nào? ❓",
    "Áo len này ấm ghê... 🧣",
    "Đừng nhìn tôi như thế chứ... ⁄(⁄ ⁄•⁄-⁄•⁄ ⁄)⁄",
    "Trời bắt đầu lạnh rồi... ❄️",
  ];

  const blushingQuotes = [
    "Đỏ mặt rồi... đừng chọc nữa! ⁄(⁄ ⁄•⁄-⁄•⁄ ⁄)⁄",
    "Mau đi làm việc đi mà! 💢",
    "C-cảm ơn bạn đã đồng hành... 💖",
    "Tôi không có ngại đâu nhé! ⁄(⁄ ⁄•⁄-⁄•⁄ ⁄)⁄",
  ];

  const wavingQuotes = [
    "Chào bạn! Chúc ngày mới vui vẻ 🌸",
    "Hôm nay cảm thấy thế nào? 🛋️",
    "Mệt thì chợp mắt chút nha~ 💤",
    "Cà phê hay trà sữa nào? 🧋",
  ];

  const triggerYohanCheer = (
    e: React.MouseEvent,
    setter: React.Dispatch<React.SetStateAction<number>>,
    quotes: string[],
    x: number,
    y: number
  ) => {
    e.stopPropagation();
    setter((prev) => (prev + 1) % quotes.length);
    try {
      confetti({
        particleCount: 28,
        spread: 45,
        origin: { x, y },
        colors: ["#18181B", "#E11D48", "#FB7185", "#F59E0B", "#FFFFFF"],
      });
    } catch {}
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-visible">
      {/* 1. TOP HEADER: Chic Cafe Washi Tape "LỊCH TRÌNH GO YOHAN ☕" */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div
          className="w-40 sm:w-52 h-7 bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 shadow-md flex items-center justify-center rotate-[-1deg]"
          style={{
            clipPath:
              "polygon(4% 0%, 96% 0%, 100% 10%, 98% 90%, 94% 100%, 6% 100%, 0% 90%, 2% 10%)",
          }}
        >
          <span className="text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5">
            <span>👓 GO YOHAN</span>
            <span className="text-rose-500">♥</span>
            <span>SCHEDULE</span>
          </span>
        </div>
      </div>

      {/* 2. TOP-LEFT: Go Yohan reading schedule with exclamation mark ! */}
      <div
        onClick={(e) =>
          triggerYohanCheer(e, setReadingIdx, readingQuotes, 0.22, 0.12)
        }
        className="absolute -top-14 sm:-top-16 -left-3 sm:-left-6 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm để Go Yohan kiểm tra lịch!"
      >
        <div className="relative">
          <div className="w-18 h-18 sm:w-20 sm:h-20 drop-shadow-md animate-mascot-wiggle">
            <img
              src="/illustrations/yohan/yohan_reading.png"
              alt="Go Yohan đọc lịch"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>

          {/* Speech Bubble */}
          <div className="absolute -top-2 left-14 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-bold px-2.5 py-1 rounded-2xl rounded-bl-xs border-2 border-zinc-900 dark:border-zinc-300 shadow-md transform -rotate-3 transition-transform group-hover:scale-110 flex items-center gap-1">
            <span className="text-rose-600 font-black">!</span>
            <span>{readingQuotes[readingIdx]}</span>
            <div className="absolute -bottom-1.5 left-1 w-2 h-2 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-zinc-900 dark:border-zinc-300 rotate-45" />
          </div>
        </div>
      </div>

      {/* 3. TOP-RIGHT: Go Yohan with Megaphone Announcer 📢 */}
      <div
        onClick={(e) =>
          triggerYohanCheer(e, setMegaphoneIdx, megaphoneQuotes, 0.8, 0.12)
        }
        className="absolute -top-14 sm:-top-17 right-3 sm:right-6 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm để Go Yohan phát loa thông báo!"
      >
        <div className="relative">
          <div className="w-18 h-18 sm:w-20 sm:h-20 drop-shadow-md animate-peek-bounce">
            <img
              src="/illustrations/yohan/yohan_megaphone.png"
              alt="Go Yohan cầm loa phóng thanh"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>

          {/* Speech Bubble */}
          <div className="absolute -top-3 right-12 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-bold px-2.5 py-1 rounded-2xl rounded-br-xs border-2 border-zinc-900 dark:border-zinc-300 shadow-md transform rotate-2 transition-transform group-hover:scale-110 flex items-center gap-1">
            <span className="text-rose-600 font-black">📢</span>
            <span>{megaphoneQuotes[megaphoneIdx]}</span>
            <div className="absolute -bottom-1.5 right-2 w-2 h-2 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-zinc-900 dark:border-zinc-300 rotate-45" />
          </div>
        </div>
      </div>

      {/* 4. MID-LEFT (Desktop only): Go Yohan Cheering "Fighting!" with Milk Box 🥛 */}
      <div
        onClick={(e) =>
          triggerYohanCheer(e, setCheeringIdx, cheeringQuotes, 0.1, 0.5)
        }
        className="absolute top-1/2 -translate-y-1/2 -left-12 sm:-left-14 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-110 hidden xl:block"
        title="Bấm để Go Yohan tiếp thêm động lực!"
      >
        <div className="relative flex flex-col items-center">
          <div className="w-18 h-20 drop-shadow-md animate-mascot-wiggle">
            <img
              src="/illustrations/yohan/yohan_cheering.png"
              alt="Go Yohan cố lên"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div className="mt-1 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-900 dark:border-zinc-300 shadow-xs">
            <span>{cheeringQuotes[cheeringIdx]}</span>
          </div>
        </div>
      </div>

      {/* 5. MID-RIGHT (Desktop only): Go Yohan running in tracksuit 🏃‍♂️ */}
      <div
        onClick={(e) =>
          triggerYohanCheer(e, setRunningIdx, runningQuotes, 0.9, 0.5)
        }
        className="absolute top-1/2 -translate-y-1/2 -right-12 sm:-right-14 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-110 hidden xl:block"
        title="Bấm để cổ vũ Go Yohan chạy nhanh!"
      >
        <div className="relative flex flex-col items-center">
          <div className="w-18 h-18 drop-shadow-md animate-peek-bounce">
            <img
              src="/illustrations/yohan/yohan_running.png"
              alt="Go Yohan chạy thể thao"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div className="mt-1 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-900 dark:border-zinc-300 shadow-xs">
            <span>{runningQuotes[runningIdx]}</span>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM-LEFT: Cozy Turtleneck Go Yohan with confusion ?! */}
      <div
        onClick={(e) =>
          triggerYohanCheer(e, setTurtleneckIdx, turtleneckQuotes, 0.22, 0.88)
        }
        className="absolute -bottom-9 sm:-bottom-12 -left-3 sm:-left-6 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm vào Go Yohan áo len ấm áp!"
      >
        <div className="relative">
          <div className="w-16 h-20 sm:w-18 sm:h-22 drop-shadow-md animate-mascot-wiggle">
            <img
              src="/illustrations/yohan/yohan_turtleneck.png"
              alt="Go Yohan áo len cổ lọ"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>

          {/* Speech Bubble */}
          <div className="absolute -top-3 left-10 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-bold px-2.5 py-1 rounded-2xl rounded-bl-xs border-2 border-zinc-900 dark:border-zinc-300 shadow-md transform -rotate-2 transition-transform group-hover:scale-110 flex items-center gap-1">
            <span className="text-amber-500 font-black">?!</span>
            <span>{turtleneckQuotes[turtleneckIdx]}</span>
            <div className="absolute -bottom-1.5 left-1 w-2 h-2 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-zinc-900 dark:border-zinc-300 rotate-45" />
          </div>
        </div>
      </div>

      {/* 7. BOTTOM-CENTER: Go Yohan hugging cushion & waving gently with flowers 🌸 */}
      <div
        onClick={(e) =>
          triggerYohanCheer(e, setWavingIdx, wavingQuotes, 0.5, 0.88)
        }
        className="absolute -bottom-9 sm:-bottom-11 left-1/2 -translate-x-1/2 z-25 pointer-events-auto cursor-pointer group transition-transform hover:-translate-y-2 hidden sm:block"
        title="Bấm vào Go Yohan ôm gối vẫy tay chào!"
      >
        <div className="relative flex flex-col items-center">
          <div className="mb-0.5 whitespace-nowrap bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white dark:border-zinc-800 shadow-xs transition-transform group-hover:scale-110">
            <span>{wavingQuotes[wavingIdx]}</span>
          </div>
          <div className="w-14 h-16 drop-shadow-sm animate-float-bob">
            <img
              src="/illustrations/yohan/yohan_waving.png"
              alt="Go Yohan vẫy tay chào"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
        </div>
      </div>

      {/* 8. BOTTOM-RIGHT: Flustered Blushing Go Yohan leaning over desk ⁄(⁄ ⁄•⁄-⁄•⁄ ⁄)⁄ */}
      <div
        onClick={(e) =>
          triggerYohanCheer(e, setBlushingIdx, blushingQuotes, 0.78, 0.88)
        }
        className="absolute -bottom-8 sm:-bottom-11 -right-3 sm:-right-6 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm vào Go Yohan đang đỏ mặt ngại ngùng!"
      >
        <div className="relative">
          <div className="w-18 h-18 sm:w-20 sm:h-20 drop-shadow-md animate-peek-bounce">
            <img
              src="/illustrations/yohan/yohan_blushing.png"
              alt="Go Yohan đỏ mặt"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>

          {/* Speech Bubble */}
          <div className="absolute -top-3 right-8 whitespace-nowrap bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 text-[11px] font-bold px-2.5 py-1 rounded-2xl rounded-br-xs border-2 border-zinc-900 dark:border-zinc-300 shadow-md transform rotate-2 transition-transform group-hover:scale-110 flex items-center gap-1">
            <span>{blushingQuotes[blushingIdx]}</span>
            <div className="absolute -bottom-1.5 right-2 w-2 h-2 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-zinc-900 dark:border-zinc-300 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
};
