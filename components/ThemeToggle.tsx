"use client";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme, isManual, useAutoTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      onDoubleClick={(e) => {
        e.preventDefault();
        useAutoTheme();
      }}
      title={
        isManual
          ? "Toggle theme (double-click to follow your device's time again)"
          : "Toggle theme — currently following the time of day"
      }
      aria-label="Toggle dark and light mode"
      className="theme-toggle relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-black/10 bg-white/70 shadow-inner transition-colors dark:border-white/10 dark:bg-white/5"
    >
      {/* Static end icons sit flush against the track's own padding, so
          they land exactly where the sliding knob starts/ends — nothing
          is eyeballed, so it can't drift off-center at either end. */}
      <span className="flex w-full items-center justify-between px-2">
        <FiSun className="h-3.5 w-3.5 text-amber-500/70" aria-hidden />
        <FiMoon className="h-3.5 w-3.5 text-indigo-400/80" aria-hidden />
      </span>
      <span
        className={`absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br shadow-md transition-transform duration-300 ease-out ${
          isDark ? "translate-x-6 from-indigo-500 to-violet-700" : "translate-x-0 from-amber-300 to-orange-500"
        }`}
      >
        {isDark ? <FiMoon className="h-3.5 w-3.5 text-white" /> : <FiSun className="h-3.5 w-3.5 text-white" />}
      </span>
      {!isManual && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium text-brick-700/50 dark:text-white/40">
          auto
        </span>
      )}
    </button>
  );
}
