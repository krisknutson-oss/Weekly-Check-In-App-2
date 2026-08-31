import React from 'react';
import { AppRoute, ClassroomState } from '../types';
import { Sparkles, Shield, Award, ArrowRight, LogIn } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface LandingViewProps {
  state: ClassroomState;
  onNavigate?: (route: AppRoute) => void;
  onSelectRole?: (role: 'teacher' | 'student') => void;
  onQuickStudentLogin?: (studentId: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  state,
  onNavigate,
  onSelectRole,
  onQuickStudentLogin,
}) => {
  const publishedCount = state.weeks.filter((w) => w.status === 'published').length;
  const totalStudents = state.students.length;

  const handleTeacherClick = () => {
    playClickSound();
    if (onSelectRole) onSelectRole('teacher');
    else if (onNavigate) onNavigate('teacher-auth');
  };

  const handleStudentClick = () => {
    playClickSound();
    if (onSelectRole) onSelectRole('student');
    else if (onNavigate) onNavigate('student-login');
  };

  return (
    <div className="flex flex-col items-center text-center pt-8 pb-16 px-4 max-w-5xl mx-auto">
      {/* Top Eyebrow Tag */}
      <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-black font-bold bg-[#D4AF37] px-4 py-1.5 rounded-full mb-6 shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
        <span>Weekly Check-ins &middot; Unit Culminating Activity</span>
      </div>

      {/* Main headline */}
      <h1 className="font-serif italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white max-w-3xl leading-[1.15] mb-5 tracking-tight">
        Turn each week’s slides into the quiz that gets everyone ready<span className="text-[#888888]">.</span>
      </h1>

      <p className="text-[#888888] text-base md:text-lg max-w-2xl leading-relaxed mb-12 font-light">
        Upload your weekly PowerPoint presentation, extract lesson concepts, automatically author a rigorous 20-question check-in with Gemini 3.7 Flash, and track class mastery toward the culminating unit exam.
      </p>

      {/* Primary Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-12">
        {/* Teacher Card */}
        <div
          id="teacher-portal-card"
          className="bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] hover:border-white/[0.2] rounded-3xl p-8 text-left transition-all duration-300 flex flex-col justify-between group shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-1"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-black font-bold bg-[var(--gold)] px-3 py-1 rounded-full shadow-xs">
                Staff &middot; Co-Teachers
              </span>
              <Shield className="w-5 h-5 text-[#888888] group-hover:text-[var(--gold)] transition-colors" />
            </div>
            <h3 className="font-serif italic text-2xl text-white mb-2.5">
              Teacher Dashboard
            </h3>
            <p className="text-xs md:text-sm text-[#888888] leading-relaxed mb-6 font-light">
              Create weeks, drag &amp; drop PowerPoint (.pptx) decks, auto-generate and edit 20-question quizzes, manage PIN codes, and inspect class struggle analytics.
            </p>
          </div>

          <div className="space-y-2">
            <button
              id="go-teacher-btn"
              onClick={handleTeacherClick}
              className="w-full py-3.5 px-4 bg-gradient-to-b from-[#222222] to-[#161616] hover:from-[#2a2a2a] hover:to-[#1e1e1e] border border-white/[0.1] hover:border-white/[0.2] text-white font-medium rounded-2xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-98"
            >
              <LogIn className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span>Teacher Login / Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Student Card */}
        <div
          id="student-portal-card"
          className="bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] hover:border-white/[0.2] rounded-3xl p-8 text-left transition-all duration-300 flex flex-col justify-between group shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-1"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-black font-bold bg-[#22C55E] px-3 py-1 rounded-full shadow-xs">
                Roster &middot; Students
              </span>
              <Award className="w-5 h-5 text-[#888888] group-hover:text-[#22C55E] transition-colors" />
            </div>
            <h3 className="font-serif italic text-2xl text-white mb-2.5">
              Student Portal
            </h3>
            <p className="text-xs md:text-sm text-[#888888] leading-relaxed mb-6 font-light">
              Log in with your 4-digit PIN, complete your weekly 20-question check-in, receive instant feedback with explanations, and view your personal progress trend.
            </p>
          </div>

          <button
            id="go-student-btn"
            onClick={handleStudentClick}
            className="w-full py-3.5 px-4 bg-gradient-to-b from-[var(--gold-light,#E5C158)] to-[var(--gold,#D4AF37)] hover:brightness-110 text-black font-bold rounded-2xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] active:scale-98"
          >
            <span>Open Student Portal</span>
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
      </div>

      {/* Classroom Status Snapshot */}
      <div className="w-full max-w-3xl bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] rounded-3xl p-6 sm:p-8 text-left shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#777777] mb-1 font-mono">Active Course</div>
            <h4 className="font-serif italic text-xl text-white">
              {state.className}
            </h4>
            <p className="text-xs text-[#888888] mt-1 font-light">
              Culminating Goal: <span className="text-[#E0E0E0]">{state.culminatingActivityTitle || state.unitGoal}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-white/[0.08] px-4 py-2 rounded-2xl shadow-inner">
              <div className="text-[9px] uppercase tracking-widest text-[#777777] font-mono">Roster</div>
              <div className="font-mono text-xs font-semibold text-white">{totalStudents} Enrolled</div>
            </div>
            <div className="bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-white/[0.08] px-4 py-2 rounded-2xl shadow-inner">
              <div className="text-[9px] uppercase tracking-widest text-[#777777] font-mono">Modules</div>
              <div className="font-mono text-xs font-bold text-black bg-[var(--gold)] px-2.5 py-0.5 rounded-full mt-0.5">{publishedCount} Published</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
