import React, { useState, useEffect } from 'react';
import { ClassroomState, ColorSchemeId, Student, Teacher, UserView, Week, ClassroomData } from './types';
import {
  loadClassroomState,
  saveClassroomState,
  resetClassroomState,
  loadAppStore,
  buildClassroomStateFromClass,
  getActiveClassForTeacher,
} from './utils/storage';
import { getSavedColorScheme, saveColorScheme, applyColorSchemeToDOM } from './utils/theme';
import { Topbar } from './components/Topbar';
import { LandingView } from './components/LandingView';
import { TeacherAuth } from './components/TeacherAuth';
import { TeacherDashboard } from './components/TeacherDashboard/TeacherDashboard';
import { StudentLogin } from './components/StudentDashboard/StudentLogin';
import { StudentHome } from './components/StudentDashboard/StudentHome';
import { QuizTaking } from './components/StudentDashboard/QuizTaking';
import { StudentFeedback } from './components/StudentDashboard/StudentFeedback';

export default function App() {
  const [state, setState] = useState<ClassroomState>(() => loadClassroomState());
  const [currentView, setCurrentView] = useState<UserView>('landing');
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [activeWeek, setActiveWeek] = useState<Week | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [teacherAuthInitialMode, setTeacherAuthInitialMode] = useState<'login' | 'create'>('login');
  const [currentTheme, setCurrentTheme] = useState<ColorSchemeId>(() => getSavedColorScheme());

  // Initialize and synchronize color scheme
  useEffect(() => {
    applyColorSchemeToDOM(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (newTheme: ColorSchemeId) => {
    setCurrentTheme(newTheme);
    saveColorScheme(newTheme);
  };

  // Sync state whenever changes occur
  const handleUpdateState = (newState: ClassroomState) => {
    setState(newState);
    saveClassroomState(newState);
  };

  // Reset sample classroom data
  const handleResetData = () => {
    const freshState = resetClassroomState();
    setState(freshState);
    setCurrentTeacher(null);
    setCurrentStudent(null);
    setActiveWeek(null);
    setCurrentView('landing');
  };

  // Switch role / view
  const handleSelectRole = (role: 'teacher' | 'student') => {
    if (role === 'teacher') {
      if (currentTeacher) {
        // Ensure state is loaded for this teacher's active class
        const store = loadAppStore();
        const activeClass = getActiveClassForTeacher(currentTeacher.id);
        setState(buildClassroomStateFromClass(activeClass, currentTeacher, store.teachers));
        setCurrentView('teacher-dashboard');
      } else {
        setTeacherAuthInitialMode('login');
        setCurrentView('teacher-auth');
      }
    } else {
      if (currentStudent) {
        setCurrentView('student-home');
      } else {
        setCurrentView('student-login');
      }
    }
  };

  // Teacher Login / Signup Success (Isolated Teacher Account)
  const handleTeacherLogin = (teacher: Teacher, activeClass?: ClassroomData) => {
    setCurrentTeacher(teacher);
    const store = loadAppStore();
    const targetClass = activeClass || getActiveClassForTeacher(teacher.id);
    const updatedState = buildClassroomStateFromClass(targetClass, teacher, store.teachers);
    setState(updatedState);
    setCurrentView('teacher-dashboard');
  };

  // Student Login Success (Scoped to Selected Class)
  const handleStudentLogin = (student: Student, classData?: ClassroomData) => {
    setCurrentStudent(student);
    if (classData) {
      const store = loadAppStore();
      const teacher = store.teachers.find((t) => t.id === classData.teacherId) || store.teachers[0];
      const classState = buildClassroomStateFromClass(classData, teacher, store.teachers);
      setState(classState);
    }
    setCurrentView('student-home');
  };

  // Completely Log out of both Teacher & Student sessions
  const handleLogout = () => {
    setCurrentTeacher(null);
    setCurrentStudent(null);
    setActiveWeek(null);
    setCurrentView('landing');
  };

  // Teacher specifically wants to switch account or add co-teacher
  const handleOpenTeacherAuth = (mode: 'login' | 'create' = 'login') => {
    setTeacherAuthInitialMode(mode);
    setCurrentView('teacher-auth');
  };

  // Student starts taking a quiz
  const handleStartQuiz = (week: Week) => {
    setActiveWeek(week);
    setCurrentView('student-quiz');
  };

  // Student views feedback for completed quiz
  const handleViewFeedback = (week: Week) => {
    setActiveWeek(week);
    setCurrentView('student-feedback');
  };

  // Student submits quiz answers
  const handleSubmitQuiz = (answers: number[]) => {
    if (!currentStudent || !activeWeek) return;

    // Calculate score
    let score = 0;
    activeWeek.quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        score++;
      }
    });

    const submission = {
      studentId: currentStudent.id,
      weekId: activeWeek.id,
      score,
      total: activeWeek.quiz.length,
      answers,
      submittedAt: Date.now(),
    };

    const studentResults = { ...(state.results[currentStudent.id] || {}) };
    studentResults[activeWeek.id] = submission;

    const updatedResults = {
      ...state.results,
      [currentStudent.id]: studentResults,
    };

    const updatedState: ClassroomState = {
      ...state,
      results: updatedResults,
    };

    handleUpdateState(updatedState);
    setCurrentView('student-feedback');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-[var(--text-secondary)] flex flex-col font-sans selection:bg-[var(--gold)]/30 selection:text-[var(--gold)] transition-colors duration-200">
      {/* Top Header Bar */}
      <Topbar
        state={state}
        currentView={currentView}
        currentTeacher={currentTeacher}
        currentStudent={currentStudent}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: Landing Page */}
        {currentView === 'landing' && (
          <LandingView state={state} onSelectRole={handleSelectRole} />
        )}

        {/* VIEW 2: Teacher Authentication & Account Creation */}
        {currentView === 'teacher-auth' && (
          <TeacherAuth
            state={state}
            onLoginSuccess={handleTeacherLogin}
            onUpdateState={handleUpdateState}
            onBack={() => setCurrentView('landing')}
            initialMode={teacherAuthInitialMode}
          />
        )}

        {/* VIEW 3: Teacher Dashboard */}
        {currentView === 'teacher-dashboard' && currentTeacher && (
          <TeacherDashboard
            state={state}
            currentTeacher={currentTeacher}
            onUpdateState={handleUpdateState}
            onSwitchAccount={() => handleOpenTeacherAuth('login')}
            onAddCoTeacher={() => handleOpenTeacherAuth('create')}
            onLogout={handleLogout}
          />
        )}

        {/* VIEW 4: Student Login */}
        {currentView === 'student-login' && (
          <StudentLogin
            state={state}
            onLoginSuccess={handleStudentLogin}
            onBack={() => setCurrentView('landing')}
          />
        )}

        {/* VIEW 5: Student Home Dashboard */}
        {currentView === 'student-home' && currentStudent && (
          <StudentHome
            state={state}
            student={currentStudent}
            onStartQuiz={handleStartQuiz}
            onViewFeedback={handleViewFeedback}
          />
        )}

        {/* VIEW 6: Student Quiz Taking */}
        {currentView === 'student-quiz' && currentStudent && activeWeek && (
          <QuizTaking
            student={currentStudent}
            week={activeWeek}
            onSubmitAnswers={handleSubmitQuiz}
            onCancel={() => setCurrentView('student-home')}
          />
        )}

        {/* VIEW 7: Student Quiz Feedback */}
        {currentView === 'student-feedback' && currentStudent && activeWeek && (
          <StudentFeedback
            student={currentStudent}
            week={activeWeek}
            submission={
              (state.results[currentStudent.id] || {})[activeWeek.id] || {
                studentId: currentStudent.id,
                weekId: activeWeek.id,
                score: 0,
                total: activeWeek.quiz.length,
                answers: [],
                submittedAt: Date.now(),
              }
            }
            onBackToHome={() => setCurrentView('student-home')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1F1F1F] py-4 px-6 text-center text-xs font-mono text-[#666666] bg-[#0A0A0A]/80">
        <p>
          The Weekly Ledger &middot; Isolated Educator Accounts &middot; Multi-Class Roster &amp; Theme Engine
        </p>
      </footer>
    </div>
  );
}
