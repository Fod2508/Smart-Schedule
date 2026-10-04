import React, { useState } from "react";
import confetti from "canvas-confetti";

export const CuteCalendarFrame: React.FC = () => {
  // Interactive speech bubble states
  const [topLeftIdx, setTopLeftIdx] = useState(0);
  const [topRightIdx, setTopRightIdx] = useState(0);
  const [bottomLeftIdx, setBottomLeftIdx] = useState(0);
  const [bottomCenterIdx, setBottomCenterIdx] = useState(0);
  const [bottomRightIdx, setBottomRightIdx] = useState(0);

  const topLeftQuotes = [
    "HELLO!",
    "Chào ngày mới! ☀️",
    "Năng lượng lên nào! 🐻",
    "Lịch trình hôm nay xịn quá! ✨",
  ];

  const topRightQuotes = [
    "HI!",
    "Tập trung nha! 🎯",
    "Bạn làm tốt lắm! ⭐",
    "Đừng thức khuya nha! 🌙",
  ];

  const bottomLeftQuotes = [
    "CỐ LÊN!",
    "Song kiếm hợp bích! 🚀",
    "AI luôn đồng hành 🤖",
    "Sắp xong việc rồi! 🏆",
  ];

  const bottomCenterQuotes = [
    "👀",
    "Tò mò ghê nha!",
    "Nghỉ chút đi! ☕",
    "Uống đủ nước chưa? 💧",
  ];

  const bottomRightQuotes = [
    "💖",
    "Yêu đời lên nha! 🌸",
    "Cười tươi lên nào! 😊",
    "Thả triệu tim! 💕",
  ];

  const triggerCheer = (
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
        colors: ["#f472b6", "#fb923c", "#facc15", "#4ade80", "#60a5fa"],
      });
    } catch {}
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-visible">
      {/* 1. TOP WASHI TAPE - Như tờ lịch/sổ tay dán trên bàn */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div
          className="w-28 sm:w-36 h-6 sm:h-7 bg-amber-200/85 dark:bg-amber-400/30 backdrop-blur-xs border border-amber-300/80 dark:border-amber-400/40 shadow-xs rotate-[-1.5deg] flex items-center justify-center opacity-90"
          style={{
            clipPath:
              "polygon(4% 0%, 96% 0%, 100% 10%, 98% 90%, 94% 100%, 6% 100%, 0% 90%, 2% 10%)",
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(245, 158, 11, 0.18) 6px, rgba(245, 158, 11, 0.18) 12px)",
          }}
        >
          <span className="text-[10px] font-black tracking-wider text-amber-800/80 dark:text-amber-200 uppercase">
            THỜI KHÓA BIỂU
          </span>
        </div>
      </div>

      {/* 2. TOP-LEFT: Peeking Bear + Corner Rainbow + "HELLO" Bubble */}
      <div
        onClick={(e) =>
          triggerCheer(e, setTopLeftIdx, topLeftQuotes, 0.25, 0.15)
        }
        className="absolute -top-11 sm:-top-13 -left-3 sm:-left-6 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm để chào bé Gấu!"
      >
        {/* Corner Rainbow Arch */}
        <div className="absolute -top-6 left-5 -z-10 opacity-90 transform -rotate-12 pointer-events-none">
          <svg width="60" height="35" viewBox="0 0 60 35" fill="none">
            {/* Outer Red Arc */}
            <path
              d="M 5 35 A 25 25 0 0 1 55 35"
              stroke="#F87171"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Middle Yellow Arc */}
            <path
              d="M 10 35 A 20 20 0 0 1 50 35"
              stroke="#FBBF24"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Inner Cyan Arc */}
            <path
              d="M 15 35 A 15 15 0 0 1 45 35"
              stroke="#38BDF8"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Peeking Bear Body */}
        <div className="relative">
          <svg
            width="82"
            height="68"
            viewBox="0 0 82 68"
            fill="none"
            className="drop-shadow-md animate-mascot-wiggle"
          >
            {/* Ears */}
            <circle
              cx="16"
              cy="20"
              r="12"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />
            <circle cx="16" cy="20" r="6" fill="#F9A8D4" />
            <circle
              cx="66"
              cy="20"
              r="12"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />
            <circle cx="66" cy="20" r="6" fill="#F9A8D4" />

            {/* Head */}
            <ellipse
              cx="41"
              cy="38"
              rx="32"
              ry="26"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />

            {/* Muzzle */}
            <ellipse
              cx="41"
              cy="44"
              rx="15"
              ry="11"
              fill="#FDF2E2"
              stroke="#382315"
              strokeWidth="2"
            />
            {/* Nose */}
            <ellipse cx="41" cy="40" rx="4.5" ry="3.5" fill="#382315" />
            {/* Smile */}
            <path
              d="M 37 45 Q 41 49 45 45"
              stroke="#382315"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Eyes with white twinkle */}
            <ellipse cx="28" cy="33" rx="3.5" ry="4.5" fill="#26170E" />
            <circle cx="27" cy="31.5" r="1.5" fill="white" />
            <ellipse cx="54" cy="33" rx="3.5" ry="4.5" fill="#26170E" />
            <circle cx="53" cy="31.5" r="1.5" fill="white" />

            {/* Blushing Cheeks */}
            <circle cx="21" cy="40" r="4.5" fill="#FB7185" opacity="0.8" />
            <circle cx="61" cy="40" r="4.5" fill="#FB7185" opacity="0.8" />

            {/* Paws clutching top border */}
            <g className="animate-paw-wave">
              <ellipse
                cx="14"
                cy="56"
                rx="8"
                ry="6"
                fill="#A76E43"
                stroke="#382315"
                strokeWidth="2.5"
              />
              <circle cx="12" cy="54" r="1.5" fill="#FDF2E2" />
              <circle cx="15" cy="53" r="1.5" fill="#FDF2E2" />
            </g>
            <ellipse
              cx="68"
              cy="58"
              rx="8"
              ry="6"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />
            <circle cx="66" cy="56" r="1.5" fill="#FDF2E2" />
            <circle cx="69" cy="55" r="1.5" fill="#FDF2E2" />
          </svg>

          {/* Speech Bubble: "HELLO" */}
          <div className="absolute -top-3 left-14 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-black px-2.5 py-1 rounded-2xl rounded-bl-xs border-2 border-zinc-900 shadow-md transform -rotate-3 transition-transform group-hover:scale-110">
            <span>{topLeftQuotes[topLeftIdx]}</span>
            <div className="absolute -bottom-1.5 left-1 w-2 h-2 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-zinc-900 rotate-45" />
          </div>
        </div>
      </div>

      {/* 3. TOP-RIGHT: Hanging Upside-Down Playful Bear + "HI!" Bubble */}
      <div
        onClick={(e) =>
          triggerCheer(e, setTopRightIdx, topRightQuotes, 0.72, 0.15)
        }
        className="absolute -top-10 sm:-top-12 right-6 sm:right-16 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm để chào bé Gấu nghịch ngợm!"
      >
        <div className="relative">
          <svg
            width="74"
            height="62"
            viewBox="0 0 74 62"
            fill="none"
            className="drop-shadow-md animate-peek-bounce"
          >
            {/* Two Paws Hooked over the top border */}
            <ellipse
              cx="20"
              cy="8"
              rx="7"
              ry="6"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />
            <ellipse
              cx="54"
              cy="8"
              rx="7"
              ry="6"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />

            {/* Upside down Head */}
            <ellipse
              cx="37"
              cy="34"
              rx="28"
              ry="23"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />

            {/* Ears (pointing downwards because upside down) */}
            <circle
              cx="14"
              cy="48"
              r="10"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />
            <circle cx="14" cy="48" r="5" fill="#F9A8D4" />
            <circle
              cx="60"
              cy="48"
              r="10"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2.5"
            />
            <circle cx="60" cy="48" r="5" fill="#F9A8D4" />

            {/* Upside-down Face */}
            <ellipse
              cx="37"
              cy="30"
              rx="13"
              ry="9.5"
              fill="#FDF2E2"
              stroke="#382315"
              strokeWidth="1.8"
            />
            <ellipse cx="37" cy="33" rx="4" ry="3" fill="#382315" />
            {/* Smile upside down (appears happy) */}
            <path
              d="M 33 26 Q 37 22 41 26"
              stroke="#382315"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Eyes */}
            <circle cx="26" cy="38" r="3.5" fill="#26170E" />
            <circle cx="25" cy="37" r="1.2" fill="white" />
            <circle cx="48" cy="38" r="3.5" fill="#26170E" />
            <circle cx="47" cy="37" r="1.2" fill="white" />

            {/* Blushing Cheeks */}
            <circle cx="20" cy="34" r="3.5" fill="#FB7185" opacity="0.8" />
            <circle cx="54" cy="34" r="3.5" fill="#FB7185" opacity="0.8" />
          </svg>

          {/* Speech Bubble: "HI!" */}
          <div className="absolute top-2 -right-10 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-black px-2.5 py-1 rounded-2xl rounded-tl-xs border-2 border-zinc-900 shadow-md transform rotate-6 transition-transform group-hover:scale-110">
            <span>{topRightQuotes[topRightIdx]}</span>
            <div className="absolute -top-1.5 left-2 w-2 h-2 bg-white dark:bg-zinc-800 border-l-2 border-t-2 border-zinc-900 rotate-45" />
          </div>
        </div>
      </div>

      {/* 4. RIGHT SIDE: Semicircle Rainbow Arc (like reference image) */}
      <div className="absolute top-1/4 -right-8 sm:-right-12 z-0 hidden lg:block pointer-events-none opacity-85">
        <svg width="65" height="110" viewBox="0 0 65 110" fill="none">
          {/* Rainbow Arcs bursting from behind right border */}
          <path
            d="M 0 10 A 45 45 0 0 1 0 100"
            stroke="#F87171"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M 0 19 A 36 36 0 0 1 0 91"
            stroke="#FB923C"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 0 27 A 28 28 0 0 1 0 83"
            stroke="#FDE047"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 0 35 A 20 20 0 0 1 0 75"
            stroke="#4ADE80"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 0 42 A 13 13 0 0 1 0 68"
            stroke="#38BDF8"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Cloud puff at rainbow foot */}
          <ellipse
            cx="8"
            cy="100"
            rx="12"
            ry="7"
            fill="white"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* 5. BOTTOM-LEFT: The Duo Friends (Teddy Bear + AI Mascot Cat) */}
      <div
        onClick={(e) =>
          triggerCheer(e, setBottomLeftIdx, bottomLeftQuotes, 0.25, 0.85)
        }
        className="absolute -bottom-8 sm:-bottom-10 -left-2 sm:-left-5 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm để hai bạn nhỏ cổ vũ bạn!"
      >
        <div className="relative">
          <svg
            width="112"
            height="70"
            viewBox="0 0 112 70"
            fill="none"
            className="drop-shadow-md"
          >
            {/* Fluffy white cloud base */}
            <path
              d="M 8 64 Q 15 50 35 55 Q 55 45 75 56 Q 95 48 106 64 Z"
              fill="white"
              stroke="#382315"
              strokeWidth="2"
            />

            {/* Friend 1: Warm Brown Bear (left) */}
            <g className="animate-mascot-wiggle">
              {/* Ears */}
              <circle
                cx="16"
                cy="26"
                r="8"
                fill="#A76E43"
                stroke="#382315"
                strokeWidth="2"
              />
              <circle cx="16" cy="26" r="4" fill="#F9A8D4" />
              <circle
                cx="46"
                cy="24"
                r="8"
                fill="#A76E43"
                stroke="#382315"
                strokeWidth="2"
              />
              <circle cx="46" cy="24" r="4" fill="#F9A8D4" />

              {/* Head */}
              <ellipse
                cx="31"
                cy="38"
                rx="21"
                ry="18"
                fill="#A76E43"
                stroke="#382315"
                strokeWidth="2"
              />
              {/* Muzzle */}
              <ellipse
                cx="31"
                cy="42"
                rx="10"
                ry="8"
                fill="#FDF2E2"
                stroke="#382315"
                strokeWidth="1.5"
              />
              <ellipse cx="31" cy="40" rx="3.5" ry="2.5" fill="#382315" />
              <path
                d="M 28 43 Q 31 46 34 43"
                stroke="#382315"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Eyes */}
              <circle cx="23" cy="35" r="2.5" fill="#26170E" />
              <circle cx="22" cy="34" r="0.8" fill="white" />
              <circle cx="39" cy="35" r="2.5" fill="#26170E" />
              <circle cx="38" cy="34" r="0.8" fill="white" />
              {/* Blush */}
              <circle cx="18" cy="40" r="3" fill="#FB7185" opacity="0.8" />
              <circle cx="44" cy="40" r="3" fill="#FB7185" opacity="0.8" />
            </g>

            {/* Friend 2: AI Mascot Chibi Cat (right) */}
            <g className="animate-peek-bounce">
              {/* Cat Ears */}
              <polygon
                points="60,24 68,6 77,20"
                fill="#F8FAFC"
                stroke="#382315"
                strokeWidth="2"
              />
              <polygon points="63,22 68,11 74,19" fill="#F472B6" />
              <polygon
                points="88,20 97,6 104,24"
                fill="#F8FAFC"
                stroke="#382315"
                strokeWidth="2"
              />
              <polygon points="90,19 97,11 101,22" fill="#F472B6" />

              {/* Antenna with golden star */}
              <line
                x1="82"
                y1="14"
                x2="82"
                y2="5"
                stroke="#382315"
                strokeWidth="1.5"
              />
              <circle cx="82" cy="4" r="3" fill="#FACC15" />

              {/* Head */}
              <ellipse
                cx="82"
                cy="35"
                rx="22"
                ry="18"
                fill="#FFFFFF"
                stroke="#382315"
                strokeWidth="2"
              />
              {/* Cyan Visor / Big Anime Eyes */}
              <ellipse cx="73" cy="33" rx="4" ry="5.5" fill="#0284C7" />
              <circle cx="71.5" cy="31" r="1.8" fill="white" />
              <circle cx="74" cy="35" r="1" fill="#7DD3FC" />

              <ellipse cx="91" cy="33" rx="4" ry="5.5" fill="#0284C7" />
              <circle cx="89.5" cy="31" r="1.8" fill="white" />
              <circle cx="92" cy="35" r="1" fill="#7DD3FC" />

              {/* Pink Cute Mouth */}
              <path
                d="M 79 38 Q 82 41 85 38"
                stroke="#382315"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Cheeks */}
              <circle cx="68" cy="37" r="3.5" fill="#FB7185" opacity="0.8" />
              <circle cx="96" cy="37" r="3.5" fill="#FB7185" opacity="0.8" />

              {/* White Kitty Paw resting on border */}
              <ellipse
                cx="88"
                cy="52"
                rx="6"
                ry="5"
                fill="#FFFFFF"
                stroke="#382315"
                strokeWidth="2"
              />
              <circle cx="86" cy="51" r="1" fill="#F472B6" />
              <circle cx="89" cy="50" r="1" fill="#F472B6" />
            </g>
          </svg>

          {/* Speech Bubble */}
          <div className="absolute -top-4 right-0 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-black px-2.5 py-1 rounded-2xl rounded-bl-xs border-2 border-zinc-900 shadow-md transform -rotate-3 transition-transform group-hover:scale-110">
            <span>{bottomLeftQuotes[bottomLeftIdx]}</span>
            <div className="absolute -bottom-1.5 left-3 w-2 h-2 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-zinc-900 rotate-45" />
          </div>
        </div>
      </div>

      {/* 6. BOTTOM-CENTER: Curious Little Bear Head peeking up (just like reference image!) */}
      <div
        onClick={(e) =>
          triggerCheer(e, setBottomCenterIdx, bottomCenterQuotes, 0.5, 0.88)
        }
        className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 z-25 pointer-events-auto cursor-pointer group transition-transform hover:-translate-y-2 hidden sm:block"
        title="Bấm vào bé Gấu tò mò!"
      >
        <div className="relative flex flex-col items-center">
          {/* Little speech popup */}
          <div className="mb-0.5 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-zinc-900 shadow-xs transition-transform group-hover:scale-110">
            <span>{bottomCenterQuotes[bottomCenterIdx]}</span>
          </div>

          <svg
            width="58"
            height="32"
            viewBox="0 0 58 32"
            fill="none"
            className="drop-shadow-sm"
          >
            {/* Little Ears */}
            <circle
              cx="12"
              cy="12"
              r="7"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="3.5" fill="#F9A8D4" />
            <circle
              cx="46"
              cy="12"
              r="7"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2"
            />
            <circle cx="46" cy="12" r="3.5" fill="#F9A8D4" />

            {/* Forehead and upper face peeking over the edge */}
            <path
              d="M 5 32 Q 5 12 29 12 Q 53 12 53 32 Z"
              fill="#A76E43"
              stroke="#382315"
              strokeWidth="2"
            />

            {/* Big Curious Eyes */}
            <ellipse cx="20" cy="23" rx="3.5" ry="4.5" fill="#26170E" />
            <circle cx="19" cy="21.5" r="1.5" fill="white" />
            <ellipse cx="38" cy="23" rx="3.5" ry="4.5" fill="#26170E" />
            <circle cx="37" cy="21.5" r="1.5" fill="white" />

            {/* Rosy Cheeks */}
            <circle cx="12" cy="28" r="3" fill="#FB7185" opacity="0.8" />
            <circle cx="46" cy="28" r="3" fill="#FB7185" opacity="0.8" />
          </svg>
        </div>
      </div>

      {/* 7. BOTTOM-RIGHT: Waving Bear + Heart Bubble 💖 + Clouds (like reference image) */}
      <div
        onClick={(e) =>
          triggerCheer(e, setBottomRightIdx, bottomRightQuotes, 0.75, 0.85)
        }
        className="absolute -bottom-8 sm:-bottom-10 -right-2 sm:-right-6 z-25 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
        title="Bấm để nhận tim từ bé Gấu!"
      >
        <div className="relative">
          <svg
            width="90"
            height="72"
            viewBox="0 0 90 72"
            fill="none"
            className="drop-shadow-md"
          >
            {/* Fluffy cloud under the bear */}
            <path
              d="M 4 64 Q 15 50 35 56 Q 55 46 72 58 Q 82 50 88 64 Z"
              fill="white"
              stroke="#382315"
              strokeWidth="2"
            />

            {/* Waving Bear Body */}
            <g className="animate-mascot-wiggle">
              {/* Ears */}
              <circle
                cx="30"
                cy="20"
                r="9"
                fill="#A76E43"
                stroke="#382315"
                strokeWidth="2.2"
              />
              <circle cx="30" cy="20" r="4.5" fill="#F9A8D4" />
              <circle
                cx="66"
                cy="20"
                r="9"
                fill="#A76E43"
                stroke="#382315"
                strokeWidth="2.2"
              />
              <circle cx="66" cy="20" r="4.5" fill="#F9A8D4" />

              {/* Head */}
              <ellipse
                cx="48"
                cy="34"
                rx="25"
                ry="21"
                fill="#A76E43"
                stroke="#382315"
                strokeWidth="2.2"
              />
              {/* Muzzle */}
              <ellipse
                cx="48"
                cy="39"
                rx="12"
                ry="9"
                fill="#FDF2E2"
                stroke="#382315"
                strokeWidth="1.8"
              />
              <ellipse cx="48" cy="36" rx="4" ry="2.8" fill="#382315" />
              <path
                d="M 44 41 Q 48 44 52 41"
                stroke="#382315"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Eyes */}
              <circle cx="38" cy="30" r="3" fill="#26170E" />
              <circle cx="37" cy="29" r="1" fill="white" />
              <circle cx="58" cy="30" r="3" fill="#26170E" />
              <circle cx="57" cy="29" r="1" fill="white" />

              {/* Blushing cheeks */}
              <circle cx="31" cy="36" r="3.5" fill="#FB7185" opacity="0.8" />
              <circle cx="65" cy="36" r="3.5" fill="#FB7185" opacity="0.8" />

              {/* Left hand resting on calendar border */}
              <ellipse
                cx="26"
                cy="48"
                rx="7"
                ry="5"
                fill="#A76E43"
                stroke="#382315"
                strokeWidth="2"
              />
              <circle cx="25" cy="46" r="1.2" fill="#FDF2E2" />

              {/* Right hand waving! */}
              <g className="animate-paw-wave">
                <ellipse
                  cx="76"
                  cy="28"
                  rx="7"
                  ry="5.5"
                  fill="#A76E43"
                  stroke="#382315"
                  strokeWidth="2"
                />
                <circle cx="75" cy="26" r="1.2" fill="#FDF2E2" />
                <circle cx="78" cy="27" r="1.2" fill="#FDF2E2" />
              </g>
            </g>
          </svg>

          {/* Heart Speech Bubble */}
          <div className="absolute -top-3 left-0 whitespace-nowrap bg-white dark:bg-zinc-800 text-rose-500 text-xs font-black px-2.5 py-1 rounded-2xl rounded-br-xs border-2 border-zinc-900 shadow-md transform rotate-6 transition-transform group-hover:scale-110">
            <span>{bottomRightQuotes[bottomRightIdx]}</span>
            <div className="absolute -bottom-1.5 right-2 w-2 h-2 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-zinc-900 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
};
