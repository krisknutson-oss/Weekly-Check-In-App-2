import React, { useState } from 'react';
import { ClassroomState, Teacher, ClassroomData } from '../../types';
import {
  hashPassword,
  uid,
  saveClassroomState,
  loadAppStore,
  saveAppStore,
  getClassesForTeacher,
  addClassToTeacher,
  setActiveClassForTeacher,
  buildClassroomStateFromClass,
  updateTeacherProfile,
  deleteTeacherAccount,
} from '../../utils/storage';
import { playClickSound, playSuccessChime } from '../../utils/sound';
import {
  UserPlus,
  Shield,
  Trash2,
  KeyRound,
  Check,
  AlertCircle,
  Mail,
  BookOpen,
  ArrowRightLeft,
  Sparkles,
  Award,
  Lock,
  School,
  Plus,
  Settings2,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface FacultyTabProps {
  state: ClassroomState;
  currentTeacher: Teacher;
  onUpdateState: (newState: ClassroomState) => void;
  onSwitchTeacher: (teacher: Teacher) => void;
  onDeleteCurrentAccount?: () => void;
}

export const FacultyTab: React.FC<FacultyTabProps> = ({
  state,
  currentTeacher,
  onUpdateState,
  onSwitchTeacher,
  onDeleteCurrentAccount,
}) => {
  const [store, setStore] = useState(() => loadAppStore());
  const allTeachers = store.teachers;
  const teacherClasses = getClassesForTeacher(currentTeacher.id);

  // Profile Edit State
  const [profileName, setProfileName] = useState(currentTeacher.name);
  const [profileSubject, setProfileSubject] = useState(currentTeacher.subject || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // New Class Form State
  const [showNewClassForm, setShowNewClassForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState(currentTeacher.subject || 'General Studies');
  const [newClassPeriod, setNewClassPeriod] = useState('Period 1');

  // Deletion Modal State
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Feedback State
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!profileName.trim()) {
      setErrorMessage('Name cannot be empty.');
      return;
    }

    const updatedTeacher: Teacher = {
      ...currentTeacher,
      name: profileName.trim(),
      subject: profileSubject.trim() || undefined,
    };

    if (showPasswordChange && newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters in length.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      updatedTeacher.passwordHash = await hashPassword(newPassword);
    }

    updateTeacherProfile(updatedTeacher);
    const updatedStore = loadAppStore();
    setStore(updatedStore);
    const activeClass = getClassesForTeacher(updatedTeacher.id).find((c) => c.id === state.id) || getClassesForTeacher(updatedTeacher.id)[0];
    const newState = buildClassroomStateFromClass(activeClass, updatedTeacher, updatedStore.teachers);
    onUpdateState(newState);

    playSuccessChime();
    setSuccessMessage('Educator profile & credentials updated successfully.');
    setShowPasswordChange(false);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Add Isolated Class
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const freshClass = addClassToTeacher(
      currentTeacher.id,
      newClassName.trim(),
      newClassSubject.trim() || 'General Studies',
      newClassPeriod.trim() || 'Period 1'
    );

    const updatedStore = loadAppStore();
    setStore(updatedStore);
    const newState = buildClassroomStateFromClass(freshClass, currentTeacher, updatedStore.teachers);
    onUpdateState(newState);

    setNewClassName('');
    setShowNewClassForm(false);
    playSuccessChime();
    setSuccessMessage(`New class "${freshClass.className}" created!`);
  };

  // Handle Account Deletion
  const handleConfirmDelete = () => {
    if (!teacherToDelete) return;
    playClickSound();

    const targetId = teacherToDelete.id;
    const targetName = teacherToDelete.name;
    const isDeletingSelf = targetId === currentTeacher.id;

    deleteTeacherAccount(targetId);
    const freshStore = loadAppStore();
    setStore(freshStore);
    setTeacherToDelete(null);
    setDeleteConfirmationText('');

    if (isDeletingSelf) {
      playSuccessChime();
      if (onDeleteCurrentAccount) {
        onDeleteCurrentAccount();
      }
    } else {
      playSuccessChime();
      setSuccessMessage(`Educator account for ${targetName} was permanently removed.`);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Isolation Guarantee Banner */}
      <div className="bg-[#161616] border border-[#262626] rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-[var(--gold)]" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
            Account &amp; Classroom Isolation Active
          </h4>
          <p className="text-[11px] font-mono text-[#888888] leading-relaxed mt-0.5">
            Each educator account is strictly separated. Your student rosters, PowerPoint slide uploads, weekly 20-question quizzes, and grading ledgers are only accessible by you.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="bg-[#EF4444]/10 border-l-2 border-[#EF4444] p-3 text-xs text-[#EF4444] flex items-start gap-2 rounded-r-lg font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-[#22C55E]/10 border-l-2 border-[#22C55E] p-3 text-xs text-[#22C55E] flex items-start gap-2 rounded-r-lg font-mono">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid of Account Settings & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: My Profile & Security */}
        <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--gold)] font-semibold flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Educator Profile &amp; Security</span>
            </h3>
            <span className="text-[10px] font-mono text-[#888888] bg-[#161616] px-2 py-0.5 rounded-md">
              ID: {currentTeacher.id.slice(0, 8)}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-mono text-[#888888] mb-1">
                Full Name &amp; Title
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-mono text-[#888888] mb-1">
                Email Address (Login ID)
              </label>
              <input
                type="email"
                value={currentTeacher.email}
                disabled
                className="w-full px-3 py-2 bg-[#121212] border border-[#1F1F1F] rounded-lg text-sm text-[#777777] cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-mono text-[#888888] mb-1">
                Primary Subject / Department
              </label>
              <input
                type="text"
                value={profileSubject}
                onChange={(e) => setProfileSubject(e.target.value)}
                placeholder="e.g. Social Studies, Integrated Sciences"
                className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
              />
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs font-mono text-[var(--gold)] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{showPasswordChange ? 'Cancel Password Change' : 'Change Account Password'}</span>
              </button>
            </div>

            {showPasswordChange && (
              <div className="p-3.5 bg-[#141414] border border-[#262626] rounded-xl space-y-2.5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-mono text-[#888888] mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-lg text-sm font-mono text-white focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-mono text-[#888888] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-lg text-sm font-mono text-white focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] hover:border-[var(--gold)] text-white text-xs font-mono uppercase tracking-wider rounded-lg cursor-pointer transition font-medium"
            >
              Save Profile Changes
            </button>
          </form>

          {/* Danger Zone: Delete Own Account */}
          <div className="pt-4 mt-4 border-t border-[#261515] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[#EF4444] font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Delete Educator Account</span>
                </div>
                <div className="text-[10px] text-[#888888] font-mono mt-0.5">
                  Permanently remove this educator account and all isolated classes, rosters, and quiz ledgers.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setTeacherToDelete(currentTeacher);
                }}
                className="px-2.5 py-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-xs font-mono uppercase tracking-wider rounded-lg cursor-pointer transition shrink-0 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: My Isolated Classes */}
        <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--gold)] font-semibold flex items-center gap-2">
              <School className="w-4 h-4" />
              <span>My Classes ({teacherClasses.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowNewClassForm(!showNewClassForm)}
              className="text-[11px] font-mono uppercase tracking-wider bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 border border-[var(--gold)]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add Class</span>
            </button>
          </div>

          {/* Quick Add Class Form */}
          {showNewClassForm && (
            <form onSubmit={handleAddClass} className="p-3.5 bg-[#141414] border border-[#262626] rounded-xl space-y-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--gold)] font-semibold">
                + Create Another Isolated Class
              </div>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class Name (e.g. Period 2: World History)"
                className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  placeholder="Subject"
                  className="px-3 py-1.5 bg-[#1A1A1A] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                />
                <input
                  type="text"
                  value={newClassPeriod}
                  onChange={(e) => setNewClassPeriod(e.target.value)}
                  placeholder="Period / Section"
                  className="px-3 py-1.5 bg-[#1A1A1A] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewClassForm(false)}
                  className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-xs font-mono uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[var(--gold)] text-[#0A0A0A] text-xs font-mono uppercase font-semibold rounded-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* List of Classes */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {teacherClasses.map((cls) => {
              const isActive = cls.id === state.id;
              return (
                <div
                  key={cls.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#181818] border-[var(--gold)] text-white shadow-xs'
                      : 'bg-[#121212] border-[#1F1F1F] text-[#888888]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-2">
                      <span>{cls.className}</span>
                      {isActive && (
                        <span className="text-[9px] bg-[var(--gold)]/20 text-[var(--gold)] px-1.5 py-0.5 rounded-md font-mono">
                          Currently Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#777777] mt-0.5 flex items-center gap-2">
                      <span>Code: <strong className="text-white">{cls.classCode}</strong></span>
                      <span>&middot;</span>
                      <span>{cls.students.length} students</span>
                      <span>&middot;</span>
                      <span>{cls.weeks.length} weeks</span>
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        const targetClass = setActiveClassForTeacher(currentTeacher.id, cls.id);
                        const currentStore = loadAppStore();
                        onUpdateState(buildClassroomStateFromClass(targetClass, currentTeacher, currentStore.teachers));
                      }}
                      className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] hover:border-[var(--gold)] text-xs font-mono text-[var(--gold)] rounded-lg cursor-pointer transition"
                    >
                      Switch
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3: Registered Educators Directory */}
      <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-2.5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--gold)] font-semibold flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Registered Educator Accounts ({allTeachers.length})</span>
          </h3>
          <span className="text-[10px] font-mono text-[#888888]">
            Switch accounts with password authentication
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {allTeachers.map((t) => {
            const isCurrent = t.id === currentTeacher.id;
            const tClasses = getClassesForTeacher(t.id);
            return (
              <div
                key={t.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  isCurrent
                    ? 'bg-[#161616] border-[var(--gold)]/50 text-white'
                    : 'bg-[#121212] border-[#1F1F1F] text-[#888888]'
                }`}
              >
                <div>
                  <div className="font-medium text-white flex items-center gap-1.5">
                    <span>{t.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] bg-[var(--gold)]/15 text-[var(--gold)] px-1.5 py-0.5 rounded-md font-mono">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-[#777777]">{t.email}</div>
                  <div className="text-[9px] font-mono text-[#555555] mt-0.5">
                    {tClasses.length} {tClasses.length === 1 ? 'class' : 'classes'} &middot; {t.subject || 'General'}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        onSwitchTeacher(t);
                      }}
                      className="p-1.5 text-[#888888] hover:text-[var(--gold)] hover:bg-[#222222] rounded-lg transition cursor-pointer"
                      title="Switch to this educator account"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setTeacherToDelete(t);
                    }}
                    className="p-1.5 text-[#666666] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition cursor-pointer"
                    title={isCurrent ? 'Delete your educator account' : `Delete account for ${t.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Educator Account Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#EF4444]/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-left">
            <div className="flex items-center gap-2.5 text-[#EF4444] border-b border-[#262626] pb-3">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-mono text-sm uppercase tracking-wider font-semibold">
                Delete Educator Account?
              </h3>
            </div>

            <p className="text-xs text-[#CCCCCC] leading-relaxed font-sans">
              Are you sure you want to permanently remove the educator account for{' '}
              <strong className="text-white">{teacherToDelete.name}</strong> (
              <span className="font-mono text-[var(--gold)]">{teacherToDelete.email}</span>)?
            </p>

            <div className="bg-[#1A1111] border border-[#EF4444]/20 p-3.5 rounded-xl text-[11px] font-mono text-[#EF4444] space-y-1">
              <div className="font-semibold uppercase tracking-wider">Warning &mdash; Immediate deletion will:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[#FFAAAA]">
                <li>Erase all {getClassesForTeacher(teacherToDelete.id).length} classes created under this account</li>
                <li>Remove all associated student rosters, PINs, and quiz submissions</li>
                <li>Delete weekly presentation decks, question banks, and grading records</li>
              </ul>
            </div>

            {teacherToDelete.id === currentTeacher.id && (
              <p className="text-[11px] font-mono text-[#888888]">
                Since you are deleting your currently active session, you will be logged out immediately.
              </p>
            )}

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
                onClick={handleConfirmDelete}
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
