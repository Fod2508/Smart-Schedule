import React, { useState } from "react";
import confetti from "canvas-confetti";

interface YohanMascotProps {
  className?: string;
  onClick?: () => void;
  title?: string;
  variant?: "standing" | "waving" | "megaphone" | "cheering" | "blushing" | "cycle";
}

export const YohanMascot: React.FC<YohanMascotProps> = ({
  className = "w-10 h-10",
  onClick,
  title = "Trợ lý Go Yohan ☕ (Bấm để đổi biểu cảm)",
  variant = "cycle",
}) => {
  const avatars = [
    { src: "/illustrations/yohan/yohan_standing.png", badge: "☕", name: "Barista Yohan" },
    { src: "/illustrations/yohan/yohan_waving.png", badge: "🌸", name: "Yohan vẫy chào" },
    { src: "/illustrations/yohan/yohan_cheering.png", badge: "🥛", name: "Yohan cố lên" },
    { src: "/illustrations/yohan/yohan_megaphone.png", badge: "📢", name: "Yohan thông báo" },
    { src: "/illustrations/yohan/yohan_blushing.png", badge: "♥", name: "Yohan đỏ mặt" },
  ];

  const [avatarIdx, setAvatarIdx] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    if (variant === "cycle") {
      setAvatarIdx((prev) => (prev + 1) % avatars.length);
      try {
        confetti({
          particleCount: 15,
          spread: 35,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
          },
          colors: ["#18181B", "#E11D48", "#FB7185", "#F59E0B"],
        });
      } catch {}
    }
    if (onClick) onClick();
  };

  const current =
    variant === "cycle"
      ? avatars[avatarIdx]
      : avatars.find((a) => a.src.includes(variant)) || avatars[0];

  return (
    <div
      onClick={handleClick}
      title={title || `${current.name} (Bấm để đổi biểu cảm!)`}
      className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none group transition-transform active:scale-90 ${className}`}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-zinc-800 dark:border-zinc-300 shadow-sm bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-0.5 hover:scale-105 transition-transform">
        <img
          key={current.src}
          src={current.src}
          alt={current.name}
          className="w-full h-full object-contain select-none animate-in fade-in zoom-in-90 duration-150"
        />
      </div>
      {/* Tiny glasses / expression badge */}
      <span className="absolute -bottom-1 -right-1 text-[10px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full px-1 border border-white dark:border-zinc-900 font-bold shadow-xs">
        {current.badge}
      </span>
    </div>
  );
};
