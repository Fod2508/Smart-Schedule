import React from "react";

interface AiMascotCartoonProps {
  className?: string;
  size?: number;
  onClick?: () => void;
  title?: string;
}

export const AiMascotCartoon: React.FC<AiMascotCartoonProps> = ({
  className = "w-10 h-10",
  onClick,
  title = "Trợ lý AI",
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
        {/* Soft Background Cloud/Aura */}
        <circle
          cx="40"
          cy="42"
          r="34"
          fill="#FAF5FF"
          className="dark:fill-purple-950/60"
        />

        {/* Golden Star Antenna on top */}
        <line
          x1="40"
          y1="18"
          x2="40"
          y2="10"
          stroke="#382315"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Star */}
        <path
          d="M 40 4 L 42 8.5 L 47 10 L 42.5 12 L 40 16.5 L 37.5 12 L 33 10 L 38 8.5 Z"
          fill="#FACC15"
          stroke="#382315"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Ears */}
        {/* Left Ear */}
        <circle
          cx="22"
          cy="28"
          r="10"
          fill="#EDE9FE"
          stroke="#382315"
          strokeWidth="2.5"
        />
        <circle cx="22" cy="28" r="5" fill="#F472B6" />

        {/* Right Ear */}
        <circle
          cx="58"
          cy="28"
          r="10"
          fill="#EDE9FE"
          stroke="#382315"
          strokeWidth="2.5"
        />
        <circle cx="58" cy="28" r="5" fill="#F472B6" />

        {/* Main Round Head */}
        <ellipse
          cx="40"
          cy="44"
          rx="27"
          ry="23"
          fill="#EDE9FE"
          stroke="#382315"
          strokeWidth="2.5"
        />

        {/* Muzzle / Cheerful Face Plate (Cream) */}
        <ellipse
          cx="40"
          cy="50"
          rx="15"
          ry="11"
          fill="#FFFFFF"
          stroke="#382315"
          strokeWidth="1.8"
        />

        {/* Big Sparkling Anime Cartoon Eyes */}
        {/* Left Eye */}
        <ellipse cx="29" cy="41" rx="4" ry="5.5" fill="#1E1B4B" />
        <circle cx="27.5" cy="38.5" r="1.8" fill="white" />
        <circle cx="30.5" cy="43.5" r="1" fill="#818CF8" />

        {/* Right Eye */}
        <ellipse cx="51" cy="41" rx="4" ry="5.5" fill="#1E1B4B" />
        <circle cx="49.5" cy="38.5" r="1.8" fill="white" />
        <circle cx="52.5" cy="43.5" r="1" fill="#818CF8" />

        {/* Rosy Cheeks */}
        <circle cx="20" cy="47" r="4.5" fill="#FB7185" opacity="0.85" />
        <circle cx="60" cy="47" r="4.5" fill="#FB7185" opacity="0.85" />

        {/* Cute Little Nose */}
        <ellipse cx="40" cy="46.5" rx="2.5" ry="2" fill="#382315" />

        {/* Cute Cat-like Smile :3 */}
        <path
          d="M 36 50 Q 40 53 40 50 Q 40 53 44 50"
          stroke="#382315"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Two Cute Paws resting at bottom edge */}
        <ellipse
          cx="30"
          cy="66"
          rx="6"
          ry="4.5"
          fill="#FFFFFF"
          stroke="#382315"
          strokeWidth="2"
        />
        <circle cx="29" cy="65" r="1" fill="#F472B6" />
        <circle cx="31" cy="65" r="1" fill="#F472B6" />

        <ellipse
          cx="50"
          cy="66"
          rx="6"
          ry="4.5"
          fill="#FFFFFF"
          stroke="#382315"
          strokeWidth="2"
        />
        <circle cx="49" cy="65" r="1" fill="#F472B6" />
        <circle cx="51" cy="65" r="1" fill="#F472B6" />
      </svg>
    </div>
  );
};
