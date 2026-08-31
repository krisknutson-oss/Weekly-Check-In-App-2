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
          className="bg-gradient-to-br from-[#3D3526] via-[#322A1E] to-[#282117] border border-[#6B5A3E] hover:border-[#D4AF37] rounded-3xl p-8 text-left transition-all duration-300 flex flex-col justify-between group shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:-translate-y-1"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-black font-bold bg-[var(--gold)] px-3 py-1 rounded-full shadow-sm">
                Staff &middot; Co-Teachers
              </span>
              <Shield className="w-5 h-5 text-[#E6C673] group-hover:text-[var(--gold)] transition-colors" />
            </div>
            <h3 className="font-serif italic text-2xl text-[#FFFDF8] mb-2.5">
              Teacher Dashboard
            </h3>
            <p className="text-xs md:text-sm text-[#E2D8C7] leading-relaxed mb-6 font-normal">
              Create weeks, drag &amp; drop PowerPoint (.pptx) decks, auto-generate and edit 20-question quizzes, manage PIN codes, and inspect class struggle analytics.
            </p>
          </div>

          <div className="space-y-2">
            <button
              id="go-teacher-btn"
              onClick={handleTeacherClick}
              className="w-full py-3.5 px-4 bg-gradient-to-b from-[#F3DF95] via-[#E5C158] to-[#CCA330] hover:brightness-105 border border-[#FDE68A] text-black font-bold rounded-2xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(212,175,55,0.3)] active:scale-98"
            >
              <LogIn className="w-4 h-4 text-black" />
              <span>Teacher Login / Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </button>
          </div>
        </div>

        {/* Student Card */}
        <div
          id="student-portal-card"
          className="bg-gradient-to-br from-[#244234] via-[#1C3529] to-[#162A20] border border-[#3E7056] hover:border-[#4ADE80] rounded-3xl p-8 text-left transition-all duration-300 flex flex-col justify-between group shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:-translate-y-1"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-black font-bold bg-[#4ADE80] px-3 py-1 rounded-full shadow-sm">
                Roster &middot; Students
              </span>
              <Award className="w-5 h-5 text-[#86EFAC] group-hover:text-[#4ADE80] transition-colors" />
            </div>
            <h3 className="font-serif italic text-2xl text-[#F2FCF5] mb-2.5">
              Student Portal
            </h3>
            <p className="text-xs md:text-sm text-[#D1EBE0] leading-relaxed mb-6 font-normal">
              Log in with your 4-digit PIN, complete your weekly 20-question check-in, receive instant feedback with explanations, and view your personal progress trend.
            </p>
          </div>

          <button
            id="go-student-btn"
            onClick={handleStudentClick}
            className="w-full py-3.5 px-4 bg-gradient-to-b from-[#4ADE80] to-[#22C55E] hover:brightness-105 text-black font-bold rounded-2xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(34,197,94,0.3)] active:scale-98"
          >
            <span>Open Student Portal</span>
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
      </div>

      {/* Classroom Status Snapshot */}
      <div className="w-full max-w-3xl bg-gradient-to-br from-[#F4F8FE] to-[#EAF2FC] border-2 border-blue-500/80 rounded-3xl p-6 sm:p-8 text-left shadow-[0_12px_32px_rgba(37,99,235,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-blue-700 font-bold mb-1 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              Active Course
            </div>
            <h4 className="font-serif italic text-2xl text-gray-950 font-bold tracking-tight">
              {state.className}
            </h4>
            <p className="text-xs text-gray-700 mt-1 font-medium">
              Culminating Goal: <span className="text-gray-950 font-bold">{state.culminatingActivityTitle || state.unitGoal}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/90 border border-blue-200/90 px-4 py-2.5 rounded-2xl text-center shadow-xs">
              <div className="text-[9px] uppercase tracking-widest text-blue-800 font-bold font-mono">Roster</div>
              <div className="font-mono text-sm font-extrabold text-gray-900 mt-0.5">{totalStudents} Enrolled</div>
            </div>
            <div className="bg-white/90 border border-blue-200/90 px-4 py-2.5 rounded-2xl text-center shadow-xs">
              <div className="text-[9px] uppercase tracking-widest text-blue-800 font-bold font-mono">Modules</div>
              <div className="font-mono text-xs font-extrabold text-blue-950 bg-amber-300 border border-amber-400 px-2.5 py-0.5 rounded-full mt-0.5 inline-block">{publishedCount} Published</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
