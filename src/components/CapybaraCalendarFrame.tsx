import React, { useState } from "react";
import confetti from "canvas-confetti";

interface CapybaraCalendarFrameProps {
  zoomLevel?: "compact" | "normal" | "spacious";
}

export const CapybaraCalendarFrame: React.FC<CapybaraCalendarFrameProps> = ({
  zoomLevel = "normal",
}) => {
  const isCompact = zoomLevel === "compact";
  // Speech bubble index states
  const [topLeftIdx, setTopLeftIdx] = useState(0);
  const [topRightIdx, setTopRightIdx] = useState(0);
  const [plantIdx, setPlantIdx] = useState(0);
  const [bottomCenterIdx, setBottomCenterIdx] = useState(0);

  const topLeftQuotes = [
    "Thong thả thôi nào~ 🍊",
    "Không việc gì phải vội! 🦫",
    "Uống miếng nước cam đã 🍹",
    "Chậm mà chắc nha! 🌿",
  ];

  const topRightQuotes = [
    "Ngủ một giấc đã... 🍩",
    "Đời thảnh thơi~ 🌸",
    "Donut ngọt lịm! 😋",
    "Chill hết nấc bạn ơi! ✨",
  ];

  const plantQuotes = [
    "Mầm xanh vươn lên! 🌱",
    "Tưới nước cho mình nha! 🪴",
    "Ngày mới tươi tốt! 🍃",
  ];

  const bottomCenterQuotes = [
    "Nước ấm thích ghê ♨️",
    "Cam trên đầu không rớt đâu 🍊",
    "Thư giãn chút nào 🧘",
    "Capybara gửi năng lượng zen 🦫",
  ];

  const triggerCitrusCheer = (
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
        particleCount: 30,
        spread: 50,
        origin: { x, y },
        colors: ["#F97316", "#FBBF24", "#FB923C", "#22C55E", "#F59E0B"],
      });
    } catch {}
  };

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-20 overflow-visible transition-all duration-300 ${
        isCompact ? "scale-[0.88] origin-center" : ""
      }`}
    >
      {/* 1. TOP CENTER: Bubbly Marshmallow "THỜI KHÓA BIỂU" Header Banner */}
      <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="flex flex-col items-center">
          <div className="px-5 py-1.5 rounded-full bg-gradient-to-b from-[#FFFDF8] to-[#FFF3DC] border-2.5 border-[#3D2619] shadow-md shadow-amber-900/15 flex items-center gap-1.5">
            <span className="text-sm font-black text-[#3D2619] tracking-wider uppercase font-sans">
              Thời Khóa Biểu
            </span>
            <span className="text-xs">🍊</span>
          </div>
        </div>
      </div>

      {/* 2. TOP-LEFT: Capybara holding an orange 🍊 + Smiling Plant Pot 🪴 */}
      <div className="absolute -top-12 sm:-top-15 -left-3 sm:-left-6 z-25 pointer-events-auto flex items-end gap-1">
        {/* Smiling Succulent / Sprout Pot */}
        <div
          onClick={(e) =>
            triggerCitrusCheer(e, setPlantIdx, plantQuotes, 0.18, 0.12)
          }
          className="cursor-pointer group transition-transform hover:scale-110"
          title="Bấm vào chậu cây mầm!"
        >
          <svg
            width="42"
            height="46"
            viewBox="0 0 42 46"
            fill="none"
            className="drop-shadow-sm animate-peek-bounce"
          >
            {/* Green Sprout Leaves */}
            <path
              d="M 21 20 Q 15 12 12 15 Q 12 21 21 20 Z"
              fill="#86EFAC"
              stroke="#3D2619"
              strokeWidth="1.8"
            />
            <path
              d="M 21 20 Q 27 12 30 15 Q 30 21 21 20 Z"
              fill="#86EFAC"
              stroke="#3D2619"
              strokeWidth="1.8"
            />
            <path
              d="M 21 16 Q 18 5 21 4 Q 24 5 21 16 Z"
              fill="#4ADE80"
              stroke="#3D2619"
              strokeWidth="1.8"
            />
            {/* White Round Pot Head */}
            <circle
              cx="21"
              cy="28"
              r="12"
              fill="#F0FDF4"
              stroke="#3D2619"
              strokeWidth="2"
            />
            {/* Happy Eyes */}
            <path
              d="M 16 27 Q 18 25 20 27"
              stroke="#3D2619"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M 22 27 Q 24 25 26 27"
              stroke="#3D2619"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Mouth */}
            <ellipse cx="21" cy="31" rx="1.5" ry="1.2" fill="#3D2619" />
            {/* Blush */}
            <circle cx="15" cy="29" r="2" fill="#F472B6" opacity="0.8" />
            <circle cx="27" cy="29" r="2" fill="#F472B6" opacity="0.8" />

            {/* Terracotta Pot Base */}
            <polygon
              points="12,34 30,34 27,44 15,44"
              fill="#B45309"
              stroke="#3D2619"
              strokeWidth="2"
            />
            <rect
              x="10"
              y="33"
              width="22"
              height="3.5"
              rx="1.5"
              fill="#D97706"
              stroke="#3D2619"
              strokeWidth="1.8"
            />
          </svg>
        </div>

        {/* Capybara holding orange */}
        <div
          onClick={(e) =>
            triggerCitrusCheer(e, setTopLeftIdx, topLeftQuotes, 0.25, 0.12)
          }
          className="relative cursor-pointer group transition-transform hover:scale-105"
          title="Bấm để Capybara chia sẻ sự thảnh thơi!"
        >
          <svg
            width="82"
            height="72"
            viewBox="0 0 82 72"
            fill="none"
            className="drop-shadow-md animate-mascot-wiggle"
          >
            {/* Ears */}
            <ellipse
              cx="24"
              cy="18"
              rx="6"
              ry="8"
              transform="rotate(-20 24 18)"
              fill="#C68B59"
              stroke="#3D2619"
              strokeWidth="2.5"
            />
            <ellipse
              cx="24"
              cy="18"
              rx="3"
              ry="4.5"
              transform="rotate(-20 24 18)"
              fill="#8A5025"
            />
            <ellipse
              cx="58"
              cy="18"
              rx="6"
              ry="8"
              transform="rotate(20 58 18)"
              fill="#C68B59"
              stroke="#3D2619"
              strokeWidth="2.5"
            />
            <ellipse
              cx="58"
              cy="18"
              rx="3"
              ry="4.5"
              transform="rotate(20 58 18)"
              fill="#8A5025"
            />

            {/* Head */}
            <path
              d="M 24 23 C 24 16, 58 16, 58 23 C 65 31, 65 48, 59 55 C 51 60, 31 60, 23 55 C 17 48, 17 31, 24 23 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="2.5"
            />

            {/* Zen Eyes */}
            <path
              d="M 28 32 Q 33 29 38 32"
              stroke="#3D2619"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 44 32 Q 49 29 54 32"
              stroke="#3D2619"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Cheeks */}
            <circle cx="23" cy="38" r="4.5" fill="#FB923C" opacity="0.8" />
            <circle cx="59" cy="38" r="4.5" fill="#FB923C" opacity="0.8" />

            {/* Snout & Nostrils */}
            <path
              d="M 33 42 C 33 39, 49 39, 49 42 C 51 46, 51 51, 49 53 C 45 55, 37 55, 33 53 C 31 51, 31 46, 33 42 Z"
              fill="#B37443"
              stroke="#3D2619"
              strokeWidth="2"
            />
            <ellipse cx="38" cy="45" rx="1.8" ry="2.2" fill="#3D2619" />
            <ellipse cx="44" cy="45" rx="1.8" ry="2.2" fill="#3D2619" />

            {/* Orange being held */}
            <circle
              cx="41"
              cy="60"
              r="10"
              fill="#F97316"
              stroke="#3D2619"
              strokeWidth="2.2"
            />
            <ellipse cx="43" cy="58" rx="3" ry="2" fill="#FDBA74" />
            {/* Orange Leaf */}
            <path
              d="M 41 50 Q 45 46 48 49 Q 45 52 41 50 Z"
              fill="#22C55E"
              stroke="#3D2619"
              strokeWidth="1.5"
            />

            {/* Paws holding the orange */}
            <ellipse
              cx="31"
              cy="60"
              rx="5"
              ry="4"
              fill="#B37443"
              stroke="#3D2619"
              strokeWidth="2"
            />
            <ellipse
              cx="51"
              cy="60"
              rx="5"
              ry="4"
              fill="#B37443"
              stroke="#3D2619"
              strokeWidth="2"
            />
          </svg>

          {/* Speech Bubble */}
          <div className="absolute -top-2 left-12 whitespace-nowrap bg-[#FFFDF9] dark:bg-zinc-800 text-[#3D2619] dark:text-zinc-100 text-[11px] font-bold px-2.5 py-1 rounded-2xl rounded-bl-xs border-2 border-[#3D2619] shadow-md transform -rotate-2 transition-transform group-hover:scale-110">
            <span>{topLeftQuotes[topLeftIdx]}</span>
            <div className="absolute -bottom-1.5 left-1 w-2 h-2 bg-[#FFFDF9] dark:bg-zinc-800 border-r-2 border-b-2 border-[#3D2619] rotate-45" />
          </div>
        </div>
      </div>

      {/* 3. TOP-RIGHT: Sleepy Capybara on Strawberry Donut + Baby on Matcha Donut 🍩 */}
      <div
        onClick={(e) =>
          triggerCitrusCheer(e, setTopRightIdx, topRightQuotes, 0.75, 0.12)
        }
        className="absolute -top-12 sm:-top-16 right-4 sm:right-10 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm để đánh thức bé Capybara lười!"
      >
        <div className="relative">
          <svg
            width="100"
            height="85"
            viewBox="0 0 100 85"
            fill="none"
            className="drop-shadow-md animate-peek-bounce"
          >
            {/* Strawberry Pink Glazed Donut underneath */}
            <ellipse
              cx="68"
              cy="62"
              rx="24"
              ry="16"
              fill="#FDBA74"
              stroke="#3D2619"
              strokeWidth="2.5"
            />
            {/* Pink Icing */}
            <path
              d="M 45 62 Q 55 50 68 50 Q 81 50 91 62 Q 88 72 78 72 Q 72 66 65 72 Q 52 74 45 62 Z"
              fill="#F472B6"
              stroke="#3D2619"
              strokeWidth="1.8"
            />
            {/* Donut Hole */}
            <ellipse
              cx="68"
              cy="62"
              rx="7"
              ry="4.5"
              fill="#FFFDF9"
              stroke="#3D2619"
              strokeWidth="1.8"
            />
            {/* Sprinkles */}
            <rect x="55" y="55" width="3" height="1.5" rx="0.5" fill="#FBBF24" />
            <rect x="75" y="54" width="3" height="1.5" rx="0.5" fill="#60A5FA" />
            <rect x="83" y="65" width="3" height="1.5" rx="0.5" fill="#4ADE80" />

            {/* Big Sleepy Capybara Body lying on donut */}
            <ellipse
              cx="45"
              cy="52"
              rx="24"
              ry="18"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="2.5"
            />
            {/* Big Sleepy Capybara Head */}
            <path
              d="M 18 42 C 18 34, 40 34, 44 42 C 46 48, 46 56, 42 60 C 36 63, 22 63, 17 58 C 15 54, 15 47, 18 42 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="2.5"
            />
            {/* Ear */}
            <circle
              cx="38"
              cy="36"
              r="4.5"
              fill="#C68B59"
              stroke="#3D2619"
              strokeWidth="1.8"
            />
            {/* Sleepy eye */}
            <path
              d="M 24 48 Q 28 45 32 48"
              stroke="#3D2619"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Snout */}
            <ellipse cx="18" cy="52" rx="4" ry="4" fill="#B37443" stroke="#3D2619" strokeWidth="1.5" />
            <ellipse cx="18" cy="51" rx="1.2" ry="1.5" fill="#3D2619" />

            {/* Baby Capybara on top's back */}
            <ellipse
              cx="64"
              cy="35"
              rx="14"
              ry="11"
              fill="#C68B59"
              stroke="#3D2619"
              strokeWidth="2"
            />
            <ellipse
              cx="54"
              cy="34"
              rx="8"
              ry="7"
              fill="#C68B59"
              stroke="#3D2619"
              strokeWidth="2"
            />
            <path
              d="M 50 34 Q 53 32 56 34"
              stroke="#3D2619"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Green Matcha Donut on Baby's head */}
            <ellipse
              cx="64"
              cy="23"
              rx="15"
              ry="8.5"
              fill="#A3E635"
              stroke="#3D2619"
              strokeWidth="2"
            />
            <ellipse
              cx="64"
              cy="23"
              rx="4.5"
              ry="2.5"
              fill="#FFFDF9"
              stroke="#3D2619"
              strokeWidth="1.5"
            />
            <circle cx="58" cy="22" r="1" fill="#F87171" />
            <circle cx="70" cy="22" r="1" fill="#FBBF24" />
          </svg>

          {/* Speech Bubble */}
          <div className="absolute top-0 -right-8 whitespace-nowrap bg-[#FFFDF9] dark:bg-zinc-800 text-[#3D2619] dark:text-zinc-100 text-[11px] font-bold px-2.5 py-1 rounded-2xl rounded-tl-xs border-2 border-[#3D2619] shadow-md transform rotate-3 transition-transform group-hover:scale-110">
            <span>{topRightQuotes[topRightIdx]}</span>
            <div className="absolute -top-1.5 left-2 w-2 h-2 bg-[#FFFDF9] dark:bg-zinc-800 border-l-2 border-t-2 border-[#3D2619] rotate-45" />
          </div>
        </div>
      </div>

      {/* 4. LEFT SIDE: 3 Expression Sticker Panels (like reference image) */}
      <div className="absolute top-1/4 -left-7 sm:-left-9 -translate-y-1/2 hidden xl:flex flex-col gap-2 z-10 pointer-events-auto">
        {/* Frame 1: Paws up Capybara */}
        <div
          onClick={(e) =>
            triggerCitrusCheer(e, setTopLeftIdx, topLeftQuotes, 0.15, 0.4)
          }
          className="w-12 h-12 rounded-xl bg-[#FFFDF9] dark:bg-zinc-900 border-2 border-[#3D2619] shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Capybara xin chào!"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M 8 16 C 8 10, 28 10, 28 16 C 30 22, 30 30, 26 34 C 20 36, 16 36, 10 34 C 6 30, 6 22, 8 16 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="1.5"
            />
            <path d="M 12 20 Q 15 18 18 20" stroke="#3D2619" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 18 20 Q 21 18 24 20" stroke="#3D2619" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="18" cy="27" rx="6" ry="4" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
            <ellipse cx="11" cy="32" rx="3" ry="2" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
            <ellipse cx="25" cy="32" rx="3" ry="2" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Frame 2: Side-eye Sleepy Capybara */}
        <div
          onClick={(e) =>
            triggerCitrusCheer(e, setTopLeftIdx, topLeftQuotes, 0.15, 0.48)
          }
          className="w-12 h-12 rounded-xl bg-[#FFFDF9] dark:bg-zinc-900 border-2 border-[#3D2619] shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Capybara liếc nhìn lười biếng"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M 6 18 C 6 12, 30 12, 30 18 C 32 24, 32 32, 28 34 C 20 36, 14 36, 8 34 C 5 30, 5 24, 6 18 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="1.5"
            />
            <circle cx="14" cy="21" r="2" fill="#3D2619" />
            <circle cx="24" cy="21" r="2" fill="#3D2619" />
            <ellipse cx="20" cy="28" rx="6" ry="4" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Frame 3: Zen Eyes Closed Capybara */}
        <div
          onClick={(e) =>
            triggerCitrusCheer(e, setTopLeftIdx, topLeftQuotes, 0.15, 0.56)
          }
          className="w-12 h-12 rounded-xl bg-[#FFFDF9] dark:bg-zinc-900 border-2 border-[#3D2619] shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Capybara thiền định"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M 8 16 C 8 10, 28 10, 28 16 C 30 22, 30 30, 26 34 C 20 36, 16 36, 10 34 C 6 30, 6 22, 8 16 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="1.5"
            />
            <path d="M 11 22 Q 14 20 17 22" stroke="#3D2619" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 19 22 Q 22 20 25 22" stroke="#3D2619" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="9" cy="25" r="2" fill="#FB923C" opacity="0.8" />
            <circle cx="27" cy="25" r="2" fill="#FB923C" opacity="0.8" />
            <ellipse cx="18" cy="28" rx="5" ry="3.5" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
          </svg>
        </div>
      </div>

      {/* 5. RIGHT SIDE: 3 Expression Sticker Panels (like reference image) */}
      <div className="absolute top-1/4 -right-7 sm:-right-9 -translate-y-1/2 hidden xl:flex flex-col gap-2 z-10 pointer-events-auto">
        {/* Frame 1: Resting Chin on Paw */}
        <div
          onClick={(e) =>
            triggerCitrusCheer(e, setTopRightIdx, topRightQuotes, 0.85, 0.4)
          }
          className="w-12 h-12 rounded-xl bg-[#FFFDF9] dark:bg-zinc-900 border-2 border-[#3D2619] shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Capybara chống cằm suy ngẫm"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M 8 16 C 8 10, 28 10, 28 16 C 30 22, 30 30, 26 34 C 20 36, 16 36, 10 34 C 6 30, 6 22, 8 16 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="1.5"
            />
            <circle cx="13" cy="20" r="1.5" fill="#3D2619" />
            <circle cx="23" cy="20" r="1.5" fill="#3D2619" />
            <ellipse cx="18" cy="27" rx="6" ry="4" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
            <ellipse cx="25" cy="30" rx="4" ry="2.5" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Frame 2: Peeking curious Capybara */}
        <div
          onClick={(e) =>
            triggerCitrusCheer(e, setTopRightIdx, topRightQuotes, 0.85, 0.48)
          }
          className="w-12 h-12 rounded-xl bg-[#FFFDF9] dark:bg-zinc-900 border-2 border-[#3D2619] shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Capybara tò mò"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M 8 16 C 8 10, 28 10, 28 16 C 30 22, 30 30, 26 34 C 20 36, 16 36, 10 34 C 6 30, 6 22, 8 16 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="1.5"
            />
            <ellipse cx="13" cy="19" rx="2" ry="2.5" fill="#3D2619" />
            <ellipse cx="23" cy="19" rx="2" ry="2.5" fill="#3D2619" />
            <circle cx="12.5" cy="18" r="0.8" fill="white" />
            <circle cx="22.5" cy="18" r="0.8" fill="white" />
            <ellipse cx="18" cy="26" rx="5.5" ry="3.5" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Frame 3: Paws on border Capybara */}
        <div
          onClick={(e) =>
            triggerCitrusCheer(e, setTopRightIdx, topRightQuotes, 0.85, 0.56)
          }
          className="w-12 h-12 rounded-xl bg-[#FFFDF9] dark:bg-zinc-900 border-2 border-[#3D2619] shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          title="Capybara ngó ra"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M 8 16 C 8 10, 28 10, 28 16 C 30 22, 30 30, 26 34 C 20 36, 16 36, 10 34 C 6 30, 6 22, 8 16 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="1.5"
            />
            <path d="M 12 21 Q 15 19 18 21" stroke="#3D2619" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 18 21 Q 21 19 24 21" stroke="#3D2619" strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx="18" cy="27" rx="5" ry="3.5" fill="#B37443" stroke="#3D2619" strokeWidth="1.2" />
            <ellipse cx="10" cy="33" rx="3" ry="2" fill="#B37443" stroke="#3D2619" strokeWidth="1" />
            <ellipse cx="26" cy="33" rx="3" ry="2" fill="#B37443" stroke="#3D2619" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* 6. BOTTOM-LEFT: Fresh Ripe Orange 🍊 with Sliced Wedge */}
      <div
        onClick={(e) =>
          triggerCitrusCheer(e, setBottomCenterIdx, bottomCenterQuotes, 0.25, 0.88)
        }
        className="absolute -bottom-7 sm:-bottom-9 -left-2 sm:-left-5 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-110"
        title="Quả cam mọng nước!"
      >
        <svg width="60" height="50" viewBox="0 0 60 50" fill="none" className="drop-shadow-md">
          {/* Green Leaf */}
          <path
            d="M 28 18 Q 18 8 10 12 Q 10 20 28 18 Z"
            fill="#22C55E"
            stroke="#3D2619"
            strokeWidth="1.8"
          />
          {/* Full Orange */}
          <circle
            cx="34"
            cy="30"
            r="16"
            fill="#F97316"
            stroke="#3D2619"
            strokeWidth="2.2"
          />
          <ellipse cx="37" cy="26" rx="4" ry="2.5" fill="#FDBA74" />

          {/* Sliced Orange Wedge next to it */}
          <path
            d="M 6 36 A 14 14 0 0 0 24 44 L 16 33 Z"
            fill="#FBBF24"
            stroke="#3D2619"
            strokeWidth="2"
          />
          <path
            d="M 9 37 A 11 11 0 0 0 22 43 L 16 35 Z"
            fill="#F97316"
          />
        </svg>
      </div>

      {/* 7. BOTTOM-CENTER: Onsen Capybara with Orange on Head peeking up! */}
      <div
        onClick={(e) =>
          triggerCitrusCheer(
            e,
            setBottomCenterIdx,
            bottomCenterQuotes,
            0.5,
            0.88
          )
        }
        className="absolute -bottom-5 sm:-bottom-7 left-1/2 -translate-x-1/2 z-25 pointer-events-auto cursor-pointer group transition-transform hover:-translate-y-2 hidden sm:block"
        title="Bấm vào Capybara ngâm suối nước nóng!"
      >
        <div className="relative flex flex-col items-center">
          {/* Speech popup */}
          <div className="mb-0.5 whitespace-nowrap bg-[#FFFDF9] dark:bg-zinc-800 text-[#3D2619] dark:text-zinc-100 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#3D2619] shadow-xs transition-transform group-hover:scale-110">
            <span>{bottomCenterQuotes[bottomCenterIdx]}</span>
          </div>

          <svg
            width="64"
            height="36"
            viewBox="0 0 64 36"
            fill="none"
            className="drop-shadow-sm"
          >
            {/* Orange on head */}
            <circle
              cx="32"
              cy="6"
              r="5"
              fill="#F97316"
              stroke="#3D2619"
              strokeWidth="1.5"
            />
            <path
              d="M 32 1 Q 35 -1 36 1"
              stroke="#22C55E"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Forehead and Snout */}
            <path
              d="M 12 36 C 12 16, 52 16, 52 36 Z"
              fill="#D49B6A"
              stroke="#3D2619"
              strokeWidth="2"
            />
            {/* Ears */}
            <circle cx="16" cy="18" r="4.5" fill="#C68B59" stroke="#3D2619" strokeWidth="1.5" />
            <circle cx="48" cy="18" r="4.5" fill="#C68B59" stroke="#3D2619" strokeWidth="1.5" />

            {/* Zen Eyes */}
            <path d="M 22 25 Q 26 23 30 25" stroke="#3D2619" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 34 25 Q 38 23 42 25" stroke="#3D2619" strokeWidth="1.8" strokeLinecap="round" />

            {/* Cheeks */}
            <circle cx="17" cy="28" r="3" fill="#FB923C" opacity="0.8" />
            <circle cx="47" cy="28" r="3" fill="#FB923C" opacity="0.8" />
          </svg>
        </div>
      </div>

      {/* 8. BOTTOM-RIGHT: Fresh Ripe Orange 🍊 with Sliced Wedge */}
      <div
        onClick={(e) =>
          triggerCitrusCheer(e, setBottomCenterIdx, bottomCenterQuotes, 0.75, 0.88)
        }
        className="absolute -bottom-7 sm:-bottom-9 -right-2 sm:-right-5 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-110"
        title="Quả cam mọng nước!"
      >
        <svg width="60" height="50" viewBox="0 0 60 50" fill="none" className="drop-shadow-md">
          {/* Green Leaf */}
          <path
            d="M 32 18 Q 42 8 50 12 Q 50 20 32 18 Z"
            fill="#22C55E"
            stroke="#3D2619"
            strokeWidth="1.8"
          />
          {/* Full Orange */}
          <circle
            cx="26"
            cy="30"
            r="16"
            fill="#F97316"
            stroke="#3D2619"
            strokeWidth="2.2"
          />
          <ellipse cx="29" cy="26" rx="4" ry="2.5" fill="#FDBA74" />

          {/* Sliced Orange Wedge next to it */}
          <path
            d="M 54 36 A 14 14 0 0 1 36 44 L 44 33 Z"
            fill="#FBBF24"
            stroke="#3D2619"
            strokeWidth="2"
          />
          <path
            d="M 51 37 A 11 11 0 0 1 38 43 L 44 35 Z"
            fill="#F97316"
          />
        </svg>
      </div>
    </div>
  );
};
