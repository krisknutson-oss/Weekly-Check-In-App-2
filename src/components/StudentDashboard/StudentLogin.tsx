import React, { useState, useEffect } from 'react';
import { ClassroomState, Student, ClassroomData } from '../../types';
import {
  getPublicClassesList,
  getClassById,
  PublicClassInfo,
  saveLastSelectedStudentClass,
  getLastSelectedStudentClass,
  loadAppStore,
  saveAppStore,
} from '../../utils/storage';
import { fetchClassByCode } from '../../utils/firebaseSync';
import { playClickSound, playSuccessChime } from '../../utils/sound';
import {
  KeyRound,
  GraduationCap,
  ArrowLeft,
  AlertCircle,
  School,
  Search,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface StudentLoginProps {
  state: ClassroomState;
  onLoginSuccess: (student: Student, classData?: ClassroomData) => void;
  onBack: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  state,
  onLoginSuccess,
  onBack,
}) => {
  const [classesList, setClassesList] = useState<PublicClassInfo[]>(() => getPublicClassesList());
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    // Check if class code is in URL
    try {
      const params = new URLSearchParams(window.location.search);
      const codeParam = (params.get('code') || params.get('class') || '').trim().toUpperCase();
      const classes = getPublicClassesList();
      if (codeParam) {
        const found = classes.find((c) => c.classCode.toUpperCase() === codeParam || c.id === codeParam);
        if (found) return found.id;
      }
    } catch {}

    const saved = getLastSelectedStudentClass();
    const classes = getPublicClassesList();
    if (saved && classes.some((c) => c.id === saved)) {
      return saved;
    }
    return classes.length > 0 ? classes[0].id : state.id || '';
  });

  const [activeClassData, setActiveClassData] = useState<ClassroomData | null>(() => {
    // Check URL first
    try {
      const params = new URLSearchParams(window.location.search);
      const codeParam = (params.get('code') || params.get('class') || '').trim().toUpperCase();
      if (codeParam) {
        const store = loadAppStore();
        const found = store.classes.find((c) => c.classCode.toUpperCase() === codeParam || c.id === codeParam);
        if (found) return found;
      }
    } catch {}

    const cid = getLastSelectedStudentClass() || (getPublicClassesList()[0]?.id ?? state.id);
    if (cid) {
      const found = getClassById(cid);
      if (found) return found;
    }
    const store = loadAppStore();
    return store.classes[0] || null;
  });

  // Re-read class list if background sync loads classes
  useEffect(() => {
    const list = getPublicClassesList();
    setClassesList(list);
  }, [state.students, state.className]);

  const [classCodeInput, setClassCodeInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);

  // Refresh active class data when selected class changes
  useEffect(() => {
    if (selectedClassId) {
      const cls = getClassById(selectedClassId);
      if (cls) {
        setActiveClassData(cls);
        saveLastSelectedStudentClass(selectedClassId);
        if (cls.students.length > 0) {
          setSelectedStudentId(cls.students[0].id);
        } else {
          setSelectedStudentId('');
        }
      }
    }
  }, [selectedClassId]);

  // Keep student selection valid
  const currentStudents = activeClassData ? activeClassData.students : state.students;
  const selectedStudent = currentStudents.find((s) => s.id === selectedStudentId);

  // Set default student if none selected
  useEffect(() => {
    if (currentStudents.length > 0 && (!selectedStudentId || !currentStudents.some((s) => s.id === selectedStudentId))) {
      setSelectedStudentId(currentStudents[0].id);
    }
  }, [currentStudents, selectedStudentId]);

  const handleSelectClass = (classId: string) => {
    playClickSound();
    setSelectedClassId(classId);
    setPin('');
    setErrorMessage('');
  };

  const handleSearchClassCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const code = classCodeInput.trim().toUpperCase();
    if (!code) return;

    setSearchingCode(true);
    let matched = classesList.find((c) => c.classCode.toUpperCase() === code);
    if (!matched) {
      try {
        const cloudClass = await fetchClassByCode(code);
        if (cloudClass) {
          const store = loadAppStore();
          if (!store.classes.some((c) => c.id === cloudClass.id)) {
            store.classes.push(cloudClass);
            saveAppStore(store);
          }
          setActiveClassData(cloudClass);
          setSelectedClassId(cloudClass.id);
          setClassCodeInput('');
          setClassesList(getPublicClassesList());
          playSuccessChime();
          setSearchingCode(false);
          return;
        }
      } catch (err) {
        console.warn('Class lookup failed:', err);
      }
    }

    setSearchingCode(false);
    if (matched) {
      playClickSound();
      setSelectedClassId(matched.id);
      setClassCodeInput('');
    } else {
      setErrorMessage(`No classroom found with code "${code}". Please verify the code with your teacher.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedStudent) {
      setErrorMessage('Please select your name from the classroom roster.');
      return;
    }

    if (pin.trim() !== selectedStudent.pin) {
      setErrorMessage("The PIN entered doesn't match. Ask your teacher if you forgot your 4-digit code.");
      return;
    }

    playSuccessChime();
    onLoginSuccess(selectedStudent, activeClassData || undefined);
  };

  const handleKeypadPress = (digit: string) => {
    playClickSound();
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    playClickSound();
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Return button */}
      <button
        id="student-login-back-btn"
        onClick={() => {
          playClickSound();
          onBack();
        }}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#888888] hover:text-white mb-6 cursor-pointer transition px-3 py-1.5 rounded-xl hover:bg-white/[0.05]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Home</span>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#222222] to-[#141414] border border-white/[0.1] text-white flex items-center justify-center font-bold shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] shrink-0">
          <GraduationCap className="w-6 h-6 text-[var(--gold)]" />
        </div>
        <div>
          <h2 className="font-serif italic text-2xl sm:text-3xl text-white">
            Student Check-In Portal<span className="text-[var(--gold)]">.</span>
          </h2>
          <p className="text-xs font-mono text-[#888888]">
            Select your teacher’s class and enter your 4-digit PIN
          </p>
        </div>
      </div>

      {/* Class Selection Section (Multi-Class / Multi-Teacher Isolation) */}
      <div className="bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] rounded-3xl p-5 mb-5 shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label
            htmlFor="teacher-class-select"
            className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#CCCCCC] font-semibold flex items-center gap-1.5"
          >
            <School className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>1. Choose Teacher &amp; Class</span>
          </label>
          {activeClassData && (
            <span className="text-[10px] font-mono text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/30 px-3 py-1 rounded-full shadow-inner">
              Code: <strong className="text-white font-bold">{activeClassData.classCode}</strong>
            </span>
          )}
        </div>

        {classesList.length > 1 ? (
          <div className="space-y-2.5">
            <select
              id="teacher-class-select"
              value={selectedClassId}
              onChange={(e) => handleSelectClass(e.target.value)}
              className="w-full px-4 py-3 bg-[#161616] border border-white/[0.08] rounded-2xl text-xs text-white focus:outline-none focus:border-[var(--gold)]/60 cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
            >
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id} className="bg-[#161616] text-white py-1.5">
                  {cls.teacherName} &mdash; {cls.className} ({cls.studentCount} students)
                </option>
              ))}
            </select>

            {/* Optional Class Code Quick Search */}
            <form onSubmit={handleSearchClassCode} className="flex gap-2 pt-1">
              <input
                type="text"
                value={classCodeInput}
                onChange={(e) => setClassCodeInput(e.target.value)}
                placeholder="Or enter Class Code (e.g. SCI-301)"
                className="flex-1 px-4 py-2.5 bg-[#0E0E0E] border border-white/[0.08] text-xs font-mono uppercase text-white rounded-xl focus:outline-none focus:border-[var(--gold)]/60 placeholder:text-[#555555] shadow-inner"
              />
              <button
                type="submit"
                disabled={searchingCode}
                className="px-4 py-2.5 bg-gradient-to-b from-[#252525] to-[#191919] hover:from-[#2e2e2e] hover:to-[#222222] border border-white/[0.1] text-white text-xs font-mono uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-98"
              >
                <Search className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>{searchingCode ? 'Searching...' : 'Find'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-b from-[#161616] to-[#121212] border border-white/[0.07] rounded-2xl flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div>
              <div className="text-xs font-semibold text-white">
                {activeClassData?.className || state.className}
              </div>
              <div className="text-[11px] font-mono text-[#888888] mt-0.5">
                Instructor: {classesList[0]?.teacherName || 'Faculty'} &middot; Code: {activeClassData?.classCode || 'SCI-301'}
              </div>
            </div>
            <span className="text-[10px] font-mono text-black font-bold bg-[var(--gold)] px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(212,175,55,0.3)]">
              {currentStudents.length} Students
            </span>
          </div>
        )}
      </div>

      {/* Student PIN Input Card */}
      {currentStudents.length === 0 ? (
        <div className="bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] rounded-3xl p-8 text-center shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
          <AlertCircle className="w-9 h-9 text-[#EF4444] mx-auto mb-2" />
          <h4 className="font-serif italic text-lg text-white mb-1">
            No Students in This Class Yet
          </h4>
          <p className="text-xs text-[#888888] mb-4 font-light">
            Ask your teacher ({classesList.find((c) => c.id === selectedClassId)?.teacherName || 'Educator'}) to add you to the classroom roster.
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-gradient-to-b from-[#222222] to-[#161616] border border-white/[0.1] text-white rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer shadow-md"
          >
            Back to Home
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] space-y-6">
          {errorMessage && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 text-xs text-[#EF4444] flex items-start gap-2.5 rounded-2xl font-mono shadow-inner">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Name Selector */}
            <div>
              <label
                htmlFor="student-select"
                className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#888888] mb-2 font-medium"
              >
                2. Select Your Name
              </label>
              <select
                id="student-select"
                value={selectedStudentId}
                onChange={(e) => {
                  playClickSound();
                  setSelectedStudentId(e.target.value);
                  setPin('');
                  setErrorMessage('');
                }}
                className="w-full px-4 py-3 bg-[#151515] border border-white/[0.08] rounded-2xl text-sm text-white focus:outline-none focus:border-[var(--gold)]/60 cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
              >
                {currentStudents.map((student) => (
                  <option key={student.id} value={student.id} className="bg-[#161616] text-white py-1">
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4-Digit PIN Input */}
            <div>
              <label
                htmlFor="student-pin-input"
                className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#888888] mb-2 font-medium"
              >
                3. Enter 4-Digit PIN
              </label>
              <input
                id="student-pin-input"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full px-4 py-3.5 bg-[#141414] border border-white/[0.08] rounded-2xl text-center text-2xl tracking-[0.5em] font-mono font-bold text-white focus:outline-none focus:border-[var(--gold)]/70 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]"
                autoFocus
              />
            </div>

            {/* Quick On-Screen Number Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="py-3 bg-gradient-to-b from-[#1E1E1E] to-[#151515] hover:from-[#262626] hover:to-[#1C1C1C] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl text-base font-mono font-bold text-white transition active:scale-95 cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="py-3 bg-gradient-to-b from-[#141414] to-[#0E0E0E] hover:from-[#1A1A1A] hover:to-[#141414] border border-white/[0.06] rounded-2xl text-xs font-mono uppercase tracking-wider text-[#888888] hover:text-white cursor-pointer transition active:scale-95 shadow-inner"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3 bg-gradient-to-b from-[#1E1E1E] to-[#151515] hover:from-[#262626] hover:to-[#1C1C1C] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl text-base font-mono font-bold text-white transition active:scale-95 cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="py-3 bg-gradient-to-b from-[#141414] to-[#0E0E0E] hover:from-[#1A1A1A] hover:to-[#141414] border border-white/[0.06] rounded-2xl text-xs font-mono uppercase tracking-wider text-[#EF4444] cursor-pointer transition active:scale-95 shadow-inner"
              >
                ⌫
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="student-login-enter-btn"
              className="w-full py-4 px-4 bg-gradient-to-b from-[var(--gold-light,#E5C158)] to-[var(--gold,#D4AF37)] hover:brightness-110 text-black font-mono font-bold uppercase tracking-widest rounded-2xl text-xs transition cursor-pointer shadow-[0_8px_20px_rgba(212,175,55,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] active:scale-98 mt-3 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-black" />
              <span>Enter Weekly Check-Ins</span>
            </button>

            {/* Security reminder */}
            <div className="text-center pt-1">
              <span className="text-[11px] font-mono text-[#666666]">
                Forgot your 4-digit PIN? Please check with your teacher.
              </span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
