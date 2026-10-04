import React from "react";

interface CapybaraMascotProps {
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const CapybaraMascot: React.FC<CapybaraMascotProps> = ({
  className = "w-10 h-10",
  onClick,
  title = "Trợ lý Capybara Thảnh Thơi",
}) => {
  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none group transition-transform active:scale-90 ${className}`}
    >
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm hover:scale-105 transition-transform"
      >
        {/* Soft Warm Circle Background */}
        <circle
          cx="40"
          cy="42"
          r="34"
          fill="#FEF3C7"
          className="dark:fill-amber-950/60"
        />

        {/* Small Orange on Capybara's Head (Iconic Onsen Capybara) */}
        <ellipse cx="40" cy="17" rx="7" ry="6.5" fill="#F97316" stroke="#3D2619" strokeWidth="2" />
        <ellipse cx="41.5" cy="15.5" rx="2" ry="1.5" fill="#FB923C" />
        {/* Little Green Leaf on the Orange */}
        <path
          d="M 40 10.5 Q 44 8 46 11 Q 43 13 40 10.5 Z"
          fill="#22C55E"
          stroke="#3D2619"
          strokeWidth="1.2"
        />

        {/* Capybara Ears */}
        {/* Left Ear */}
        <ellipse
          cx="20"
          cy="27"
          rx="5"
          ry="7"
          transform="rotate(-20 20 27)"
          fill="#C68B59"
          stroke="#3D2619"
          strokeWidth="2.2"
        />
        <ellipse
          cx="20"
          cy="27"
          rx="2.5"
          ry="4"
          transform="rotate(-20 20 27)"
          fill="#8A5025"
        />

        {/* Right Ear */}
        <ellipse
          cx="60"
          cy="27"
          rx="5"
          ry="7"
          transform="rotate(20 60 27)"
          fill="#C68B59"
          stroke="#3D2619"
          strokeWidth="2.2"
        />
        <ellipse
          cx="60"
          cy="27"
          rx="2.5"
          ry="4"
          transform="rotate(20 60 27)"
          fill="#8A5025"
        />

        {/* Capybara Head (Chubby rectangular rounded snout) */}
        <path
          d="M 23 30 C 23 23, 57 23, 57 30 C 62 38, 62 55, 57 62 C 50 67, 30 67, 23 62 C 18 55, 18 38, 23 30 Z"
          fill="#D49B6A"
          stroke="#3D2619"
          strokeWidth="2.5"
        />

        {/* Forehead Highlight */}
        <ellipse cx="40" cy="33" rx="14" ry="6" fill="#DEAB7C" />

        {/* Zen Sleepy Eyes (- - or gentle chill curves) */}
        <path
          d="M 27 41 Q 31 38 35 41"
          stroke="#3D2619"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 45 41 Q 49 38 53 41"
          stroke="#3D2619"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Rosy Orange Blushing Cheeks */}
        <circle cx="23" cy="48" r="4.5" fill="#FB923C" opacity="0.8" />
        <circle cx="57" cy="48" r="4.5" fill="#FB923C" opacity="0.8" />

        {/* Iconic Capybara Broad Snout & Nostrils */}
        <path
          d="M 33 51 C 33 48, 47 48, 47 51 C 49 55, 49 60, 47 62 C 43 64, 37 64, 33 62 C 31 60, 31 55, 33 51 Z"
          fill="#B37443"
          stroke="#3D2619"
          strokeWidth="2"
        />
        {/* Nostrils */}
        <ellipse cx="37" cy="54" rx="1.8" ry="2.2" fill="#3D2619" />
        <ellipse cx="43" cy="54" rx="1.8" ry="2.2" fill="#3D2619" />
        {/* Subtle Zen Smile */}
        <path
          d="M 38 59 Q 40 61 42 59"
          stroke="#3D2619"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Two Tiny Front Paws resting at bottom */}
        <ellipse cx="32" cy="67" rx="5" ry="3.5" fill="#B37443" stroke="#3D2619" strokeWidth="2" />
        <ellipse cx="48" cy="67" rx="5" ry="3.5" fill="#B37443" stroke="#3D2619" strokeWidth="2" />
      </svg>
    </div>
  );
};
