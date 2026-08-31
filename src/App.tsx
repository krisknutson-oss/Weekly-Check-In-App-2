import React, { useState, useEffect } from 'react';
import { ClassroomState, ColorSchemeId, Student, Teacher, UserView, Week, ClassroomData, QuizSubmission } from './types';
import {
  loadClassroomState,
  saveClassroomState,
  resetClassroomState,
  loadAppStore,
  saveAppStore,
  buildClassroomStateFromClass,
  getActiveClassForTeacher,
  recordStudentSubmission,
} from './utils/storage';
import { getSavedColorScheme, saveColorScheme, applyColorSchemeToDOM } from './utils/theme';
import {
  syncLocalStoreWithCloud,
  subscribeToAllClasses,
  submitStudentQuizToCloud,
  subscribeSyncStatus,
  signOutTeacherFromFirebase,
  SyncStatus,
} from './utils/firebaseSync';
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Check URL query parameters for student join links or class codes
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code') || params.get('class');
      if (codeParam && currentView === 'landing') {
        setCurrentView('student-login');
      }
    } catch {}
  }, []);

  // Listen to sync status changes
  useEffect(() => {
    return subscribeSyncStatus((s) => setSyncStatus(s));
  }, []);

  // Perform initial cloud sync and listen for real-time updates from Firestore
  useEffect(() => {
    const localStore = loadAppStore();
    syncLocalStoreWithCloud(localStore).then((syncedStore) => {
      saveAppStore(syncedStore);
      if (currentTeacher) {
        const activeClass = getActiveClassForTeacher(currentTeacher.id);
        setState(buildClassroomStateFromClass(activeClass, currentTeacher, syncedStore.teachers));
      } else {
        const firstTeacher = syncedStore.teachers[0];
        const firstClass = syncedStore.classes[0];
        if (firstTeacher && firstClass) {
          setState((prev) => (prev.id ? prev : buildClassroomStateFromClass(firstClass, firstTeacher, syncedStore.teachers)));
        }
      }
    });

    // Real-time listener for any updates to classes (e.g. students completing quizzes or teachers publishing weeks)
    const unsubscribe = subscribeToAllClasses((cloudClasses) => {
      if (!cloudClasses || cloudClasses.length === 0) return;
      const currentStore = loadAppStore();
      currentStore.classes = cloudClasses;
      try {
        localStorage.setItem('the_weekly_ledger_multi_teacher_store_v1', JSON.stringify(currentStore));
      } catch {}

      setState((prevState) => {
        const updatedDoc = cloudClasses.find((c) => c.id === prevState.id);
        if (updatedDoc) {
          // Merge results deeply so all student answers across devices are preserved
          const mergedResults: Record<string, Record<string, QuizSubmission>> = {
            ...(prevState.results || {}),
            ...(updatedDoc.results || {}),
          };
          const allStudentKeys = new Set([
            ...Object.keys(prevState.results || {}),
            ...Object.keys(updatedDoc.results || {}),
          ]);
          allStudentKeys.forEach((sId) => {
            mergedResults[sId] = {
              ...(prevState.results?.[sId] || {}),
              ...(updatedDoc.results?.[sId] || {}),
            };
          });

          return {
            ...prevState,
            className: updatedDoc.className,
            classCode: updatedDoc.classCode,
            subject: updatedDoc.subject,
            period: updatedDoc.period,
            unitGoal: updatedDoc.unitGoal,
            culminatingActivityTitle: updatedDoc.culminatingActivityTitle,
            students: updatedDoc.students || prevState.students || [],
            weeks: updatedDoc.weeks || prevState.weeks || [],
            results: mergedResults,
          };
        }
        return prevState;
      });
    });

    return () => unsubscribe();
  }, [currentTeacher?.id]);

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
    if (currentTeacher?.isGoogleAuth) {
      signOutTeacherFromFirebase().catch(() => {});
    }
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

    const submission: QuizSubmission = {
      score,
      total: activeWeek.quiz.length,
      answers,
      submittedAt: Date.now(),
    };

    // Update local store for this classroom
    if (state.id) {
      recordStudentSubmission(state.id, currentStudent.id, activeWeek.id, submission);
    }

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

    // Sync submission directly to Firebase Firestore
    if (state.id) {
      submitStudentQuizToCloud(state.id, currentStudent.id, activeWeek.id, submission).catch((err) => {
        console.warn('Cloud submission queued or error:', err);
      });
    }

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
        syncStatus={syncStatus}
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
      <footer className="border-t border-[#1F1F1F] py-4 px-6 text-center text-xs font-mono text-[#666666] bg-[#0A0A0A]/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          The Weekly Ledger &middot; Cloud-Synced Classroom Engine &middot; Real-Time Multi-Device Roster
        </p>
        <div className="flex items-center gap-2 text-[10px]">
          <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="uppercase tracking-widest text-[#888888]">
            {syncStatus === 'synced' ? 'Cloud Connected' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}
          </span>
        </div>
      </footer>
    </div>
  );
}
