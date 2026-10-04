import React from "react";

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = "w-8 h-8",
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform select-none ${className}`}
    >
      <img
        src="/logo.svg"
        alt="Smart Schedule Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
