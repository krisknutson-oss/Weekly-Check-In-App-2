import React, { useState, useEffect } from 'react';
import { ClassroomState, Student, ClassroomData } from '../../types';
import {
  getPublicClassesList,
  getClassById,
  PublicClassInfo,
  saveLastSelectedStudentClass,
  getLastSelectedStudentClass,
  loadAppStore,
} from '../../utils/storage';
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
    const saved = getLastSelectedStudentClass();
    const classes = getPublicClassesList();
    if (saved && classes.some((c) => c.id === saved)) {
      return saved;
    }
    return classes.length > 0 ? classes[0].id : state.id || '';
  });

  const [activeClassData, setActiveClassData] = useState<ClassroomData | null>(() => {
    const cid = getLastSelectedStudentClass() || (getPublicClassesList()[0]?.id ?? state.id);
    if (cid) {
      const found = getClassById(cid);
      if (found) return found;
    }
    const store = loadAppStore();
    return store.classes[0] || null;
  });

  const [classCodeInput, setClassCodeInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

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

  const handleSearchClassCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const code = classCodeInput.trim().toUpperCase();
    if (!code) return;

    const matched = classesList.find((c) => c.classCode.toUpperCase() === code);
    if (matched) {
      playClickSound();
      setSelectedClassId(matched.id);
      setClassCodeInput('');
    } else {
      setErrorMessage(`No classroom found with code "${code}". Please check with your teacher.`);
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
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#888888] hover:text-white mb-6 cursor-pointer transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Home</span>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-11 h-11 rounded-full bg-[#161616] border border-[#1F1F1F] text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(212,175,55,0.1)] shrink-0">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-serif italic text-2xl text-white">
            Student Check-In Portal<span className="text-[#888888]">.</span>
          </h2>
          <p className="text-xs font-mono text-[#888888]">
            Select your teacher’s class and enter your 4-digit PIN
          </p>
        </div>
      </div>

      {/* Class Selection Section (Multi-Class / Multi-Teacher Isolation) */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs p-4 sm:p-5 mb-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label
            htmlFor="teacher-class-select"
            className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#CCCCCC] font-semibold flex items-center gap-1.5"
          >
            <School className="w-3.5 h-3.5 text-white" />
            <span>1. Choose Teacher &amp; Class</span>
          </label>
          {activeClassData && (
            <span className="text-[10px] font-mono text-[#888888] bg-[#161616] border border-[#222222] px-2 py-0.5 rounded-xs">
              Code: <strong className="text-white">{activeClassData.classCode}</strong>
            </span>
          )}
        </div>

        {classesList.length > 1 ? (
          <div className="space-y-2">
            <select
              id="teacher-class-select"
              value={selectedClassId}
              onChange={(e) => handleSelectClass(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#262626] rounded-xs text-xs text-white focus:outline-none focus:border-[#555555] cursor-pointer"
            >
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id} className="bg-[#161616] text-white py-1">
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
                className="flex-1 px-3 py-1.5 bg-[#0D0D0D] border border-[#222222] text-xs font-mono uppercase text-white rounded-xs focus:outline-none focus:border-[#555555] placeholder:text-[#555555]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-white text-xs font-mono uppercase tracking-wider rounded-xs cursor-pointer transition flex items-center gap-1.5"
              >
                <Search className="w-3 h-3 text-white" />
                <span>Find</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="p-3 bg-[#161616] border border-[#222222] rounded-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">
                {activeClassData?.className || state.className}
              </div>
              <div className="text-[11px] font-mono text-[#888888] mt-0.5">
                Instructor: {classesList[0]?.teacherName || 'Faculty'} &middot; Code: {activeClassData?.classCode || 'SCI-301'}
              </div>
            </div>
            <span className="text-[10px] font-mono text-black font-bold bg-[#D4AF37] px-2 py-0.5 rounded-xs">
              {currentStudents.length} Students
            </span>
          </div>
        )}
      </div>

      {/* Student PIN Input Card */}
      {currentStudents.length === 0 ? (
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs p-8 text-center shadow-xl">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
          <h4 className="font-serif italic text-lg text-white mb-1">
            No Students in This Class Yet
          </h4>
          <p className="text-xs text-[#888888] mb-4 font-light">
            Ask your teacher ({classesList.find((c) => c.id === selectedClassId)?.teacherName || 'Educator'}) to add you to the classroom roster.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#161616] border border-[#1F1F1F] text-white rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMessage && (
            <div className="bg-[#EF4444]/10 border-l-2 border-[#EF4444] p-3.5 text-xs text-[#EF4444] flex items-start gap-2 rounded-r-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Name Selector */}
            <div>
              <label
                htmlFor="student-select"
                className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#888888] mb-1.5"
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
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] cursor-pointer"
              >
                {currentStudents.map((student) => (
                  <option key={student.id} value={student.id} className="bg-[#161616] text-white">
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4-Digit PIN Input */}
            <div>
              <label
                htmlFor="student-pin-input"
                className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#888888] mb-1.5"
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
                className="w-full px-4 py-3 bg-[#161616] border border-[#1F1F1F] rounded-xs text-center text-2xl tracking-[0.5em] font-mono font-bold text-white focus:outline-none focus:border-white"
                autoFocus
              />
            </div>

            {/* Quick On-Screen Number Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="py-2.5 bg-[#161616] hover:bg-[#1f1f1f] border border-[#1F1F1F] hover:border-[#333333] rounded-xs text-base font-mono font-bold text-white transition active:scale-95 cursor-pointer shadow-xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="py-2.5 bg-[#0A0A0A] hover:bg-[#161616] border border-[#1F1F1F] rounded-xs text-xs font-mono uppercase tracking-wider text-[#888888] cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 bg-[#161616] hover:bg-[#1f1f1f] border border-[#1F1F1F] hover:border-[#333333] rounded-xs text-base font-mono font-bold text-white transition active:scale-95 cursor-pointer shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="py-2.5 bg-[#0A0A0A] hover:bg-[#161616] border border-[#1F1F1F] rounded-xs text-xs font-mono uppercase tracking-wider text-[#EF4444] cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="student-login-enter-btn"
              className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-mono font-bold uppercase tracking-widest rounded-xs text-xs transition cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)] mt-3 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-black" />
              <span>Enter Weekly Check-Ins</span>
            </button>

            {/* Hint for demo student */}
            {selectedStudent && (
              <div className="text-center pt-1">
                <span className="text-[11px] font-mono text-[#888888]">
                  Demo PIN for {selectedStudent.name}: <strong className="text-black font-bold bg-[#D4AF37] px-2 py-0.5 rounded-xs">{selectedStudent.pin}</strong>
                </span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
