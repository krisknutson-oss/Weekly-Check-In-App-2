import React, { useState } from 'react';
import { ClassroomState, Teacher, ClassroomData } from '../types';
import {
  hashPassword,
  generateResetCode,
  uid,
  loadAppStore,
  saveAppStore,
  registerNewTeacherAccount,
  getClassesForTeacher,
  getActiveClassForTeacher,
  buildClassroomStateFromClass,
  updateTeacherProfile,
  deleteTeacherAccount,
  loginOrCreateGoogleTeacher,
} from '../utils/storage';
import { signInTeacherWithGoogle } from '../utils/firebaseSync';
import { playClickSound, playSuccessChime } from '../utils/sound';
import {
  Shield,
  KeyRound,
  Mail,
  UserPlus,
  LogIn,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  BookOpen,
  Lock,
  UserCheck,
  School,
  GraduationCap,
  Trash2,
} from 'lucide-react';

interface TeacherAuthProps {
  state: ClassroomState;
  onLoginSuccess: (teacher: Teacher, activeClass?: ClassroomData) => void;
  onUpdateState: (newState: ClassroomState) => void;
  onBack: () => void;
  initialMode?: 'login' | 'create';
}

type AuthMode = 'login' | 'create' | 'forgot' | 'reset';

export const TeacherAuth: React.FC<TeacherAuthProps> = ({
  state,
  onLoginSuccess,
  onUpdateState,
  onBack,
  initialMode = 'login',
}) => {
  const [store, setStore] = useState(() => loadAppStore());
  const registeredTeachers = store.teachers;

  const [mode, setMode] = useState<AuthMode>(
    registeredTeachers.length === 0 ? 'create' : initialMode
  );

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'primary' | 'co-teacher' | 'department-head' | 'ta'>('primary');
  const [subject, setSubject] = useState('');
  const [initialClassName, setInitialClassName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Reset State
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Deletion Confirmation State
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Feedback State
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Google Login for Educators
  const handleGoogleLogin = async () => {
    playClickSound();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const user = await signInTeacherWithGoogle();
      if (!user || !user.email) {
        setErrorMessage('Could not retrieve Google account details. Please try again.');
        setIsLoading(false);
        return;
      }

      const { teacher, activeClass, isNewAccount } = loginOrCreateGoogleTeacher({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      const currentStore = loadAppStore();
      setStore(currentStore);
      const activeState = buildClassroomStateFromClass(activeClass, teacher, currentStore.teachers);
      onUpdateState(activeState);

      playSuccessChime();
      setSuccessMessage(
        isNewAccount
          ? `Welcome, ${teacher.name}! Your dedicated isolated Google educator account and classroom were created.`
          : `Welcome back, ${teacher.name}! Logged in securely with Google.`
      );

      setTimeout(() => {
        onLoginSuccess(teacher, activeClass);
      }, 350);
    } catch (err: any) {
      console.error('Google login failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in window was closed before completing.');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Google sign-in popup was blocked by browser. Please allow popups.');
      } else {
        setErrorMessage(err?.message || 'Google authentication failed. Please try again or use email.');
      }
      setIsLoading(false);
    }
  };

  // Quick Select an Existing Teacher
  const handleSelectExistingTeacher = (teacher: Teacher) => {
    playClickSound();
    setEmail(teacher.email);
    setPassword('teacher123'); // Default initial password for demo
    setErrorMessage('');
    setSuccessMessage(`Selected ${teacher.name} (${teacher.email}). Password auto-filled if using default.`);
  };

  // Handle Remove Teacher Account
  const handleConfirmDeleteTeacher = () => {
    if (!teacherToDelete) return;
    playClickSound();
    const deletedName = teacherToDelete.name;
    const deletedEmail = teacherToDelete.email;
    
    deleteTeacherAccount(teacherToDelete.id);
    const freshStore = loadAppStore();
    setStore(freshStore);

    if (email.toLowerCase() === deletedEmail.toLowerCase()) {
      setEmail('');
      setPassword('');
    }

    if (freshStore.teachers.length === 0) {
      setMode('create');
    }

    setTeacherToDelete(null);
    playSuccessChime();
    setSuccessMessage(`Educator account for ${deletedName} and all associated classes were removed.`);
  };

  // Clear fields for custom credentials
  const handleClearFields = () => {
    playClickSound();
    setEmail('');
    setPassword('');
    setName('');
    setInitialClassName('');
    setSubject('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('Inputs cleared. Type your credentials.');
  };

  // Handle Log In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your educator email address and password.');
      setIsLoading(false);
      return;
    }

    const currentStore = loadAppStore();
    const cleanEmail = email.trim().toLowerCase();
    const teacher = currentStore.teachers.find((t) => t.email.toLowerCase() === cleanEmail);

    if (!teacher) {
      setErrorMessage(
        `No educator account found with email "${cleanEmail}". Click "Create Teacher Account" above to register this account.`
      );
      setIsLoading(false);
      return;
    }

    const hashed = await hashPassword(password);
    if (hashed === teacher.passwordHash) {
      playSuccessChime();
      const teacherClass = getActiveClassForTeacher(teacher.id);
      const activeState = buildClassroomStateFromClass(teacherClass, teacher, currentStore.teachers);
      onUpdateState(activeState);

      setSuccessMessage(`Welcome back, ${teacher.name}! Loading your isolated dashboard...`);
      setTimeout(() => {
        onLoginSuccess(teacher, teacherClass);
      }, 300);
    } else {
      setErrorMessage(
        'Incorrect password. Please verify your credentials or use "Forgot password?" to set a new password.'
      );
      setIsLoading(false);
    }
  };

  // Handle Account Creation (Sign Up - Completely Isolated Teacher Account)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = subject.trim() || 'General Studies';
    const cleanClassName = initialClassName.trim() || `${cleanName}'s Classroom`;

    if (!cleanName) {
      setErrorMessage('Please enter your full name and title (e.g. Dr. Sarah Jenkins, Mr. Alvarez).');
      setIsLoading(false);
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid academic or school email address.');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password entries.');
      setIsLoading(false);
      return;
    }

    const currentStore = loadAppStore();
    if (currentStore.teachers.some((t) => t.email.toLowerCase() === cleanEmail)) {
      setErrorMessage(
        'An educator account is already registered with this email address. Please switch to "Log In" or register with another email.'
      );
      setIsLoading(false);
      return;
    }

    const passwordHash = await hashPassword(password);
    const newTeacher: Teacher = {
      id: uid('tch'),
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: role || 'primary',
      subject: cleanSubject,
      createdAt: Date.now(),
      resetCode: null,
    };

    // Register teacher and provision their isolated classroom
    const freshClass = registerNewTeacherAccount(newTeacher, cleanClassName);
    const updatedStore = loadAppStore();
    const activeState = buildClassroomStateFromClass(freshClass, newTeacher, updatedStore.teachers);
    onUpdateState(activeState);

    playSuccessChime();
    setSuccessMessage(`Account & isolated classroom successfully created for ${newTeacher.name}! Entering dashboard...`);

    setTimeout(() => {
      onLoginSuccess(newTeacher, freshClass);
    }, 400);
  };

  // Handle Generate Reset Code
  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const currentStore = loadAppStore();
    const cleanEmail = email.trim().toLowerCase();
    const teacher = currentStore.teachers.find((t) => t.email.toLowerCase() === cleanEmail);

    if (!teacher) {
      setErrorMessage(`No account found under ${cleanEmail}. Please check the email or create a new account.`);
      return;
    }

    const code = generateResetCode();
    teacher.resetCode = {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    updateTeacherProfile(teacher);
    setSimulatedCode(code);
    setMode('reset');
    setSuccessMessage(`A 15-minute one-time recovery code was generated for ${teacher.email}.`);
  };

  // Handle Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const currentStore = loadAppStore();
    const cleanEmail = email.trim().toLowerCase();
    const teacher = currentStore.teachers.find((t) => t.email.toLowerCase() === cleanEmail);

    if (!teacher || !teacher.resetCode) {
      setErrorMessage('Reset session expired or invalid. Please request a new code.');
      return;
    }

    if (Date.now() > teacher.resetCode.expiresAt) {
      setErrorMessage('This reset code has expired. Please generate a new code.');
      return;
    }

    const cleanCode = resetCodeInput.trim().toUpperCase();
    if (cleanCode !== teacher.resetCode.code.toUpperCase()) {
      setErrorMessage('The code entered does not match the generated code.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    teacher.passwordHash = await hashPassword(password);
    teacher.resetCode = null;
    updateTeacherProfile(teacher);

    playSuccessChime();
    setSuccessMessage('Password reset successfully! Logging you into your isolated dashboard...');
    const teacherClass = getActiveClassForTeacher(teacher.id);
    const activeState = buildClassroomStateFromClass(teacherClass, teacher, currentStore.teachers);
    onUpdateState(activeState);

    setTimeout(() => {
      onLoginSuccess(teacher, teacherClass);
    }, 400);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Back button */}
      <button
        id="teacher-auth-back-btn"
        onClick={() => {
          playClickSound();
          onBack();
        }}
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#888888] hover:text-white mb-6 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Home</span>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-11 h-11 rounded-full border border-[var(--gold)]/50 bg-[#121212] flex items-center justify-center font-bold text-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-serif italic text-2xl md:text-3xl text-white">
            Teacher Access Portal<span className="text-[var(--gold)]">.</span>
          </h2>
          <p className="text-xs uppercase tracking-widest font-mono text-[#888888] mt-0.5">
            Isolated Educator Accounts &middot; Dedicated Classes &amp; Rosters
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex gap-2 border-b border-[#1F1F1F] pb-3 mb-6">
        <button
          id="auth-tab-login"
          type="button"
          onClick={() => {
            playClickSound();
            setMode('login');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-widest font-mono font-semibold transition cursor-pointer border ${
            mode === 'login'
              ? 'bg-[#161616] text-[var(--gold)] border-[var(--gold)]/60 shadow-[0_0_10px_rgba(212,175,55,0.12)]'
              : 'bg-[#121212] text-[#888888] border-[#1F1F1F] hover:text-white hover:border-[#333333]'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Log In</span>
        </button>

        <button
          id="auth-tab-create"
          type="button"
          onClick={() => {
            playClickSound();
            setMode('create');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-widest font-mono font-semibold transition cursor-pointer border ${
            mode === 'create'
              ? 'bg-[#161616] text-[var(--gold)] border-[var(--gold)]/60 shadow-[0_0_10px_rgba(212,175,55,0.12)]'
              : 'bg-[#121212] text-[#888888] border-[#1F1F1F] hover:text-white hover:border-[#333333]'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Isolated Account</span>
        </button>
      </div>

      {/* Auth Card Container */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-6 sm:p-8">
        {/* Error Alert */}
        {errorMessage && (
          <div
            id="auth-error-alert"
            className="mb-5 bg-[#EF4444]/10 border-l-2 border-[#EF4444] p-3.5 text-xs text-[#EF4444] flex items-start gap-2.5 rounded-r-lg font-mono"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            id="auth-success-alert"
            className="mb-5 bg-[#22C55E]/10 border-l-2 border-[#22C55E] p-3.5 text-xs text-[#22C55E] flex items-start gap-2.5 rounded-r-lg font-mono"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* GOOGLE SIGN IN BUTTON */}
        {(mode === 'login' || mode === 'create') && (
          <div className="mb-6">
            <button
              id="google-teacher-login-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#181818] hover:bg-[#202020] border border-[#2B2B2B] hover:border-[#444444] text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-3 shadow-sm hover:shadow group disabled:opacity-50"
            >
              {/* Google Brand SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-semibold text-white group-hover:text-[var(--gold)] transition-colors">
                {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30 font-bold">
                ISOLATED
              </span>
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#202020]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#666666]">
                Or continue with password
              </span>
              <div className="flex-1 h-px bg-[#202020]" />
            </div>
          </div>
        )}

        {/* MODE 1: LOG IN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex items-center justify-between">
              <label
                className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888]"
                htmlFor="teacher-login-email"
              >
                Teacher Email Address
              </label>
              {(email || password) && (
                <button
                  type="button"
                  onClick={handleClearFields}
                  className="text-[10px] uppercase tracking-wider text-[#777777] hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                  title="Clear inputs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="teacher-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="w-full px-3.5 py-2.5 pl-10 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition font-sans"
                required
              />
              <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3 pointer-events-none" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888]"
                  htmlFor="teacher-login-password"
                >
                  Password
                </label>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => {
                    playClickSound();
                    setMode('forgot');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-[10px] uppercase tracking-wider text-[var(--gold)] hover:underline cursor-pointer font-mono"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="teacher-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition font-mono"
                  required
                />
                <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#888888] hover:text-white p-0.5 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember-me-toggle"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm accent-[var(--gold)] bg-[#161616] border-[#1F1F1F] cursor-pointer"
              />
              <label htmlFor="remember-me-toggle" className="text-xs text-[#888888] font-mono cursor-pointer select-none">
                Keep me logged in for this browser session
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="teacher-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[var(--gold)] hover:bg-[#E5C158] text-[#0A0A0A] font-mono font-semibold uppercase tracking-widest rounded-lg text-xs transition cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Isolated Account</span>
            </button>

            {/* Existing Accounts Quick Select */}
            {registeredTeachers.length > 0 && (
              <div className="pt-4 border-t border-[#1F1F1F] mt-6">
                <span className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-2.5">
                  Or Quick-Select Registered Educator:
                </span>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {registeredTeachers.map((t) => {
                    const teacherClasses = getClassesForTeacher(t.id);
                    return (
                      <div
                        key={t.id}
                        className="w-full p-2.5 bg-[#161616] hover:bg-[#1C1C1C] border border-[#222222] hover:border-[var(--gold)]/50 rounded-xl transition flex items-center justify-between group"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectExistingTeacher(t)}
                          className="flex items-center gap-2.5 flex-1 text-left cursor-pointer mr-2"
                        >
                          {t.photoURL ? (
                            <img
                              src={t.photoURL}
                              alt={t.name}
                              className="w-7 h-7 rounded-full object-cover border border-[var(--gold)]/40 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center font-bold text-[var(--gold)] text-xs shrink-0">
                              {t.name.slice(0, 1)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white group-hover:text-[var(--gold)] flex items-center gap-1.5 truncate">
                              <span className="truncate">{t.name}</span>
                              {t.isGoogleAuth && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono shrink-0">
                                  Google
                                </span>
                              )}
                              <span className="text-[9px] text-[#666666] font-mono shrink-0">
                                ({teacherClasses.length} {teacherClasses.length === 1 ? 'class' : 'classes'})
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#777777] truncate">{t.email}</div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectExistingTeacher(t)}
                            title="Select this educator"
                            className="p-1.5 text-[#555555] hover:text-[var(--gold)] hover:bg-[#222222] rounded-lg cursor-pointer transition"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClickSound();
                              setTeacherToDelete(t);
                            }}
                            title={`Remove registered account for ${t.name}`}
                            className="p-1.5 text-[#666666] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg cursor-pointer transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        )}

        {/* MODE 2: CREATE TEACHER ACCOUNT (ISOLATED) */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="bg-[#161616] border border-[#262626] p-3.5 rounded-xl text-[11px] font-mono text-[#AAAAAA] flex items-start gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
              <span>
                <strong>Isolated Account Guarantee:</strong> Your new account will have its own private classroom, students, weekly quizzes, and grades. Other educators cannot view or alter your classes.
              </span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                Full Name &amp; Academic Title
              </label>
              <input
                id="new-teacher-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Sarah Jenkins, Mr. Alvarez, etc."
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                Academic Email Address
              </label>
              <input
                id="new-teacher-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.jenkins@highschool.edu"
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                  Subject / Discipline
                </label>
                <input
                  id="new-teacher-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. World History, Biology"
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                  Initial Class Name
                </label>
                <input
                  id="new-teacher-classname"
                  type="text"
                  value={initialClassName}
                  onChange={(e) => setInitialClassName(e.target.value)}
                  placeholder="e.g. Period 1: AP European History"
                  className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                  Create Password (min 6 chars)
                </label>
                <div className="relative">
                  <input
                    id="new-teacher-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-8 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#888888] hover:text-white p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="new-teacher-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-8 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-[#888888] hover:text-white p-0.5 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              id="create-teacher-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[var(--gold)] hover:bg-[#E5C158] text-[#0A0A0A] font-mono font-semibold uppercase tracking-widest rounded-lg text-xs transition cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)] mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Isolated Account &amp; Classroom</span>
            </button>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="text-xs text-[#888888] leading-relaxed">
              Enter your registered educator email address. We will generate a secure one-time password recovery code for your isolated account.
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                Educator Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)]"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="px-4 py-2.5 bg-[#161616] border border-[#222222] text-[#888888] hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[var(--gold)] hover:bg-[#E5C158] text-[#0A0A0A] font-mono font-semibold uppercase tracking-widest rounded-lg text-xs cursor-pointer transition"
              >
                Generate Recovery Code
              </button>
            </div>
          </form>
        )}

        {/* MODE 4: RESET PASSWORD */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {simulatedCode && (
              <div className="p-3 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-lg text-xs text-[var(--gold)] font-mono flex items-center justify-between">
                <span>Recovery Code: <strong>{simulatedCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setResetCodeInput(simulatedCode)}
                  className="underline text-[11px] cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                One-Time Recovery Code
              </label>
              <input
                type="text"
                value={resetCodeInput}
                onChange={(e) => setResetCodeInput(e.target.value)}
                placeholder="XXXX-XXXX"
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm font-mono text-white focus:outline-none focus:border-[var(--gold)] uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm font-mono text-white focus:outline-none focus:border-[var(--gold)]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-lg text-sm font-mono text-white focus:outline-none focus:border-[var(--gold)]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[var(--gold)] hover:bg-[#E5C158] text-[#0A0A0A] font-mono font-semibold uppercase tracking-widest rounded-lg text-xs cursor-pointer transition shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              Update Password &amp; Log In
            </button>
          </form>
        )}
      </div>

      {/* Delete Teacher Account Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#EF4444]/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-2.5 text-[#EF4444] border-b border-[#262626] pb-3">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-mono text-sm uppercase tracking-wider font-semibold">
                Delete Educator Account?
              </h3>
            </div>

            <p className="text-xs text-[#CCCCCC] leading-relaxed font-sans">
              Are you sure you want to permanently delete the account for{' '}
              <strong className="text-white">{teacherToDelete.name}</strong> (
              <span className="font-mono text-[var(--gold)]">{teacherToDelete.email}</span>)?
            </p>

            <div className="bg-[#1A1111] border border-[#EF4444]/20 p-3.5 rounded-xl text-[11px] font-mono text-[#EF4444] space-y-1">
              <div className="font-semibold uppercase tracking-wider">This destructive action will:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[#FFAAAA]">
                <li>Permanently remove all classes created by this teacher</li>
                <li>Erase all student rosters and submissions in those classes</li>
                <li>Delete weekly presentation decks, quizzes, and grading ledgers</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-[#CCCCCC] text-xs font-mono uppercase tracking-wider rounded-lg cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTeacher}
                className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-lg cursor-pointer transition shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
