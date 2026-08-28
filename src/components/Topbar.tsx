import React from 'react';
import { Volume2, VolumeX, Stamp, RefreshCw, LogOut, ArrowLeft, Sun, Moon } from 'lucide-react';
import { AppRoute, ClassroomState, ColorSchemeId, Student, Teacher } from '../types';
import { playClickSound } from '../utils/sound';
import { ThemeSelector } from './ThemeSelector';
import { isDayMode, toggleNightDay, saveColorScheme } from '../utils/theme';
import { SyncStatus } from '../utils/firebaseSync';

interface TopbarProps {
  currentRoute?: AppRoute;
  currentView?: AppRoute;
  onNavigate: (route: AppRoute) => void;
  state: ClassroomState;
  currentTeacher: Teacher | null;
  currentStudent: Student | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentTheme: ColorSchemeId;
  onThemeChange: (themeId: ColorSchemeId) => void;
  showMovableStamp?: boolean;
  onToggleMovableStamp?: () => void;
  onResetData?: () => void;
  onLogout?: () => void;
  onLogoutTeacher?: () => void;
  onLogoutStudent?: () => void;
  syncStatus?: SyncStatus;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentRoute,
  currentView,
  onNavigate,
  state,
  currentTeacher,
  currentStudent,
  soundEnabled,
  onToggleSound,
  currentTheme,
  onThemeChange,
  showMovableStamp = false,
  onToggleMovableStamp,
  onResetData,
  onLogout,
  onLogoutTeacher,
  onLogoutStudent,
  syncStatus = 'synced',
}) => {
  const activeView = currentRoute || currentView || 'landing';

  const handleLogoutAction = () => {
    playClickSound();
    if (onLogout) onLogout();
    else if (onLogoutTeacher && (activeView === 'teacher-dashboard' || currentTeacher)) onLogoutTeacher();
    else if (onLogoutStudent) onLogoutStudent();
    else onNavigate('landing');
  };

  return (
    <header className="bg-[#0A0A0A] text-[#E0E0E0] border-b border-[#1F1F1F] px-4 md:px-8 py-3.5 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand logo & title */}
        <div
          id="brand-header"
          onClick={() => {
            playClickSound();
            onNavigate('landing');
          }}
          className="flex items-center gap-3.5 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-full border border-[var(--gold)]/50 bg-[#121212] flex items-center justify-center font-serif italic text-sm text-white group-hover:border-white group-hover:scale-105 transition-all shadow-[0_0_10px_rgba(212,175,55,0.15)]">
            WL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif italic text-lg md:text-xl text-white tracking-tight leading-none">
                The Weekly Ledger<span className="text-[#888888]">.</span>
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-mono tracking-widest text-black font-bold uppercase bg-[#D4AF37] px-1.5 py-0.5 rounded-md">
                v2.0
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#888888] block mt-0.5 font-medium">
              Classroom Progress Tracker
            </span>
          </div>
        </div>

        {/* Right action items */}
        <div className="flex items-center gap-2 md:gap-3 text-xs">
          {/* Active Teacher Badge */}
          {currentTeacher && (
            <div className="hidden md:flex items-center gap-2 bg-[#121212] border border-[#1F1F1F] px-3 py-1 rounded-md text-[#E0E0E0]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider text-[#CCCCCC] font-mono">
                {currentTeacher.name}
              </span>
            </div>
          )}

          {/* Active Student Badge */}
          {currentStudent && (
            <div className="hidden md:flex items-center gap-2 bg-[#121212] border border-[#1F1F1F] px-3 py-1 rounded-md text-[#E0E0E0]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="text-[11px] uppercase tracking-wider text-[#CCCCCC] font-mono">
                {currentStudent.name}
              </span>
            </div>
          )}

          {/* 1-Click Night / Day (Black / White) Toggle */}
          <button
            id="night-day-toggle-btn"
            type="button"
            onClick={() => {
              playClickSound();
              const nextTheme = toggleNightDay(currentTheme);
              onThemeChange(nextTheme);
              saveColorScheme(nextTheme);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition cursor-pointer text-[10px] uppercase tracking-wider font-mono select-none ${
              isDayMode(currentTheme)
                ? 'bg-[#FEF3C7] text-black font-bold border-[#FDE68A] hover:bg-[#FDE68A]'
                : 'bg-[#161616] text-[#E0E0E0] border-[#2A2A2A] hover:border-[#444444] hover:text-white'
            }`}
            title={isDayMode(currentTheme) ? 'Switch to Night Mode (Black Background)' : 'Switch to Day Mode (White Background & Reverse Text)'}
          >
            {isDayMode(currentTheme) ? (
              <>
                <Sun className="w-3.5 h-3.5 text-black" />
                <span className="font-bold text-black">Day (White)</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-white" />
                <span className="font-medium">Night (Black)</span>
              </>
            )}
          </button>

          {/* Background & Palette Selector */}
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
          />

          {/* Movable Stamp Widget Toggle */}
          {onToggleMovableStamp && (
            <button
              id="toggle-stamp-widget-btn"
              onClick={() => {
                playClickSound();
                onToggleMovableStamp();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition cursor-pointer text-[10px] uppercase tracking-widest ${
                showMovableStamp
                  ? 'bg-[#D4AF37] text-black font-bold border-[#D4AF37]'
                  : 'bg-[#121212] text-[#888888] border-[#1F1F1F] hover:text-white hover:border-[#333333]'
              }`}
              title="Toggle movable teacher stamp"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stamp</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => onToggleSound()}
            className="p-2 rounded-lg bg-[#121212] text-[#888888] border border-[#1F1F1F] hover:text-white hover:border-[#333333] transition cursor-pointer"
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-[#555555]" />}
          </button>

          {/* Reset Demo Data Button */}
          {onResetData && (
            <button
              id="reset-demo-data-btn"
              onClick={() => {
                if (window.confirm('Reset classroom data back to default sample roster & lessons?')) {
                  playClickSound();
                  onResetData();
                }
              }}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#1F1F1F] bg-[#121212] text-[#666666] hover:text-white hover:border-[#333333] transition cursor-pointer text-[10px] uppercase tracking-widest"
              title="Reset sample roster, quizzes, and class results"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Route-specific Logout / Exit button */}
          {(activeView === 'teacher-dashboard' || activeView === 'student-home' || activeView === 'student-quiz' || activeView === 'student-feedback' || currentTeacher || currentStudent) && (
            <button
              id="logout-btn"
              onClick={handleLogoutAction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#2A2A2A] text-[#E0E0E0] hover:text-[#EF4444] hover:border-[#EF4444]/60 transition cursor-pointer text-[10px] uppercase tracking-widest font-semibold shadow-xs"
              title="Log out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          )}

          {(activeView === 'teacher-auth' || activeView === 'student-login') && (
            <button
              id="back-to-landing-btn"
              onClick={() => {
                playClickSound();
                onNavigate('landing');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#121212] border border-[#1F1F1F] text-[#888888] hover:text-white hover:border-[#333333] transition cursor-pointer text-[10px] uppercase tracking-widest"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
