import React, { useState } from 'react';
import { ClassroomState, Teacher, ClassroomData, CoTeacherInvite } from '../../types';
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
  inviteCoTeacherToClass,
  removeCoTeacherFromClass,
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
  Send,
  Clock,
  CheckCircle2,
  X,
  Users,
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
  const teacherClasses = getClassesForTeacher(currentTeacher.id, currentTeacher.email);

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

  // Co-Teacher Gmail Invite State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'co-teacher' | 'department-head' | 'ta'>('co-teacher');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

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
    const activeClass = getClassesForTeacher(updatedTeacher.id, updatedTeacher.email).find((c) => c.id === state.id) || getClassesForTeacher(updatedTeacher.id, updatedTeacher.email)[0];
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

  // Send Gmail Co-Teacher Invitation
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSendingInvite(true);

    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setErrorMessage('Please enter a valid educator Gmail or school email address.');
      setIsSendingInvite(false);
      return;
    }

    if (!state.id) {
      setErrorMessage('No active classroom selected.');
      setIsSendingInvite(false);
      return;
    }

    const result = inviteCoTeacherToClass(state.id, inviteEmail.trim(), inviteRole, currentTeacher.name);

    if (!result.success) {
      setErrorMessage(result.message);
      setIsSendingInvite(false);
      return;
    }

    const freshStore = loadAppStore();
    setStore(freshStore);

    if (result.updatedClass) {
      const newState = buildClassroomStateFromClass(result.updatedClass, currentTeacher, freshStore.teachers);
      onUpdateState(newState);
    }

    playSuccessChime();
    setSuccessMessage(result.message);
    setInviteEmail('');
    setShowInviteModal(false);
    setIsSendingInvite(false);
  };

  // Remove Co-Teacher / Cancel Invitation
  const handleRemoveCoTeacher = (identifier: string, isEmail = false) => {
    if (!state.id) return;
    playClickSound();

    const result = removeCoTeacherFromClass(state.id, identifier);
    if (result.success && result.updatedClass) {
      const freshStore = loadAppStore();
      setStore(freshStore);
      const newState = buildClassroomStateFromClass(result.updatedClass, currentTeacher, freshStore.teachers);
      onUpdateState(newState);
      playSuccessChime();
      setSuccessMessage(isEmail ? `Invitation for ${identifier} was cancelled.` : 'Co-teacher was removed from this classroom.');
    }
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

  const activeClassData = store.classes.find((c) => c.id === state.id);
  const activeCoTeacherInvites: CoTeacherInvite[] = activeClassData?.coTeacherInvites || state.coTeacherInvites || [];
  const assignedCoTeacherIds = new Set(activeClassData?.coTeachers || state.coTeachers || []);
  const classCoTeachers = allTeachers.filter((t) => t.id !== currentTeacher.id && (assignedCoTeacherIds.has(t.id) || activeCoTeacherInvites.some(inv => inv.status === 'accepted' && (inv.acceptedTeacherId === t.id || inv.email.toLowerCase() === t.email.toLowerCase()))));
  const pendingInvites = activeCoTeacherInvites.filter((inv) => inv.status === 'pending');

  return (
    <div className="space-y-6 text-left">
      {/* Isolation & Co-Teacher Invitation Guarantee Banner */}
      <div className="bg-[#182234] border border-[#2A3A54] rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
            Classroom Isolation &amp; Invite-Only Collaboration
          </h4>
          <p className="text-[11px] font-mono text-[#A0B4CF] leading-relaxed mt-0.5">
            Your classrooms, student rosters, question banks, and scores remain private. Educators only become co-teachers when you explicitly send them an invite to their Gmail address.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="bg-[#EF4444]/15 border-l-3 border-[#EF4444] p-3 text-xs text-[#FCA5A5] flex items-start gap-2 rounded-r-lg font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-[#22C55E]/15 border-l-3 border-[#22C55E] p-3 text-xs text-[#86EFAC] flex items-start gap-2 rounded-r-lg font-mono">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Co-Teachers & Gmail Invitations Section (Lightened Card) */}
      <div className="bg-[#1C2433] border border-[#2D3B52] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D3B52] pb-3">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#E2E8F0] font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Active Classroom Co-Teachers &amp; Gmail Invites</span>
            </h3>
            <p className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
              Classroom: <strong className="text-white">{state.className}</strong> ({state.classCode})
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowInviteModal(true);
            }}
            className="text-[11px] font-mono uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Invite Teacher via Gmail</span>
          </button>
        </div>

        {/* Co-Teachers List for This Classroom */}
        <div className="space-y-2.5">
          {/* Primary Teacher */}
          <div className="p-3 bg-[#151D2A] border border-[#2B3950] rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs font-mono">
                ★
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>{currentTeacher.name}</span>
                  <span className="text-[9px] bg-amber-500/20 text-black border border-amber-500/30 px-1.5 py-0.5 rounded-md font-mono uppercase font-semibold">
                    Primary Instructor (Owner)
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#94A3B8]">{currentTeacher.email}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] italic">Class Creator</span>
          </div>

          {/* Active Assigned Co-Teachers */}
          {classCoTeachers.map((tch) => {
            const inviteRecord = activeCoTeacherInvites.find(inv => inv.email.toLowerCase() === tch.email.toLowerCase() || inv.acceptedTeacherId === tch.id);
            return (
              <div key={tch.id} className="p-3 bg-[#151D2A] border border-[#2B3950] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs font-mono">
                    CT
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{tch.name}</span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-md font-mono uppercase">
                        {inviteRecord?.role || 'Co-Teacher'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">{tch.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCoTeacher(tch.id, false)}
                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 rounded-lg text-[10px] font-mono uppercase transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Access</span>
                </button>
              </div>
            );
          })}

          {/* Pending Gmail Invitations */}
          {pendingInvites.map((inv) => (
            <div key={inv.email} className="p-3 bg-[#17202F] border border-dashed border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{inv.email}</span>
                    <span className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-mono uppercase">
                      Pending Sign-in ({inv.role})
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">
                    Invited {new Date(inv.invitedAt).toLocaleDateString()} &middot; Auto-activates on Google Login
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCoTeacher(inv.email, true)}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[#94A3B8] hover:text-white rounded-lg text-[10px] font-mono uppercase transition cursor-pointer"
              >
                Cancel Invite
              </button>
            </div>
          ))}

          {classCoTeachers.length === 0 && pendingInvites.length === 0 && (
            <div className="p-4 bg-[#151D2A] border border-dashed border-[#2B3950] rounded-xl text-center">
              <p className="text-xs font-mono text-[#94A3B8]">
                No external co-teachers assigned yet. You can invite colleagues by Gmail at any time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Account Settings & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: My Profile & Security */}
        <div className="bg-[#1C2433] border border-[#2D3B52] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#2D3B52] pb-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#E2E8F0] font-semibold flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Educator Profile &amp; Security</span>
            </h3>
            <span className="text-[10px] font-mono text-[#94A3B8] bg-[#151D2A] px-2 py-0.5 rounded-md border border-[#2B3950]">
              ID: {currentTeacher.id.slice(0, 8)}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-mono text-[#94A3B8] mb-1">
                Full Name &amp; Title
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-[#151D2A] border border-[#2B3950] rounded-lg text-sm text-white focus:outline-none focus:border-blue-400 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-mono text-[#94A3B8] mb-1">
                Email Address (Login ID)
              </label>
              <input
                type="email"
                value={currentTeacher.email}
                disabled
                className="w-full px-3 py-2 bg-[#121824] border border-[#202B3D] rounded-lg text-sm text-[#7D8FA9] cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-mono text-[#94A3B8] mb-1">
                Primary Subject / Department
              </label>
              <input
                type="text"
                value={profileSubject}
                onChange={(e) => setProfileSubject(e.target.value)}
                placeholder="e.g. Social Studies, Integrated Sciences"
                className="w-full px-3 py-2 bg-[#151D2A] border border-[#2B3950] rounded-lg text-sm text-white focus:outline-none focus:border-blue-400 font-sans"
              />
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{showPasswordChange ? 'Cancel Password Change' : 'Change Account Password'}</span>
              </button>
            </div>

            {showPasswordChange && (
              <div className="p-3.5 bg-[#151D2A] border border-[#2B3950] rounded-xl space-y-2.5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-mono text-[#94A3B8] mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-[#1C2433] border border-[#2B3950] rounded-lg text-sm font-mono text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-mono text-[#94A3B8] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-[#1C2433] border border-[#2B3950] rounded-lg text-sm font-mono text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#233045] hover:bg-[#2B3A54] border border-[#3B4E6F] text-white text-xs font-mono uppercase tracking-wider rounded-lg cursor-pointer transition font-medium"
            >
              Save Profile Changes
            </button>
          </form>

          {/* Danger Zone: Delete Own Account */}
          <div className="pt-4 mt-4 border-t border-[#3B2525] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[#EF4444] font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Delete Educator Account</span>
                </div>
                <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
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

        {/* Section 2: My Classes */}
        <div className="bg-[#1C2433] border border-[#2D3B52] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#2D3B52] pb-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#E2E8F0] font-semibold flex items-center gap-2">
              <School className="w-4 h-4 text-blue-400" />
              <span>My Classes ({teacherClasses.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowNewClassForm(!showNewClassForm)}
              className="text-[11px] font-mono uppercase tracking-wider bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-400/30 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add Class</span>
            </button>
          </div>

          {/* Quick Add Class Form */}
          {showNewClassForm && (
            <form onSubmit={handleAddClass} className="p-3.5 bg-[#151D2A] border border-[#2B3950] rounded-xl space-y-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
                + Create Another Isolated Class
              </div>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class Name (e.g. Period 2: World History)"
                className="w-full px-3 py-1.5 bg-[#1C2433] border border-[#2B3950] rounded-lg text-xs text-white focus:outline-none focus:border-blue-400 font-sans"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  placeholder="Subject"
                  className="px-3 py-1.5 bg-[#1C2433] border border-[#2B3950] rounded-lg text-xs text-white focus:outline-none focus:border-blue-400 font-sans"
                />
                <input
                  type="text"
                  value={newClassPeriod}
                  onChange={(e) => setNewClassPeriod(e.target.value)}
                  placeholder="Period / Section"
                  className="px-3 py-1.5 bg-[#1C2433] border border-[#2B3950] rounded-lg text-xs text-white focus:outline-none focus:border-blue-400 font-sans"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewClassForm(false)}
                  className="px-3 py-1 bg-[#1C2433] text-[#94A3B8] text-xs font-mono uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono uppercase font-semibold rounded-lg cursor-pointer"
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
              const isOwner = cls.teacherId === currentTeacher.id;
              return (
                <div
                  key={cls.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#151D2A] border-blue-400 text-white shadow-xs'
                      : 'bg-[#151D2A]/60 border-[#2B3950] text-[#94A3B8]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-2">
                      <span>{cls.className}</span>
                      {isActive && (
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-md font-mono">
                          Active
                        </span>
                      )}
                      {!isOwner && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-md font-mono">
                          Co-Taught
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5 flex items-center gap-2">
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
                      className="px-2.5 py-1 bg-[#1C2433] hover:bg-[#2B3950] border border-[#2B3950] text-xs font-mono text-blue-300 rounded-lg cursor-pointer transition"
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
      <div className="bg-[#1C2433] border border-[#2D3B52] rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#2D3B52] pb-2.5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[#E2E8F0] font-semibold flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            <span>Registered Educator Accounts ({allTeachers.length})</span>
          </h3>
          <span className="text-[10px] font-mono text-[#94A3B8]">
            Educators registered with distinct Google or password credentials
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {allTeachers.map((t) => {
            const isCurrent = t.id === currentTeacher.id;
            const tClasses = getClassesForTeacher(t.id, t.email);
            return (
              <div
                key={t.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  isCurrent
                    ? 'bg-[#151D2A] border-blue-400/50 text-white'
                    : 'bg-[#151D2A]/60 border-[#2B3950] text-[#94A3B8]'
                }`}
              >
                <div>
                  <div className="font-medium text-white flex items-center gap-1.5">
                    <span>{t.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-md font-mono">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">{t.email}</div>
                  <div className="text-[9px] font-mono text-[#64748B] mt-0.5">
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
                      className="p-1.5 text-[#94A3B8] hover:text-blue-300 hover:bg-[#1C2433] rounded-lg transition cursor-pointer"
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
                    className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition cursor-pointer"
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

      {/* Gmail Co-Teacher Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#182234] border border-[#2D3B52] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-left">
            <div className="flex items-center justify-between border-b border-[#2D3B52] pb-3">
              <div className="flex items-center gap-2 text-white">
                <Send className="w-4 h-4 text-blue-400" />
                <h3 className="font-mono text-sm uppercase tracking-wider font-semibold">
                  Invite Co-Teacher via Gmail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-[#94A3B8] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Invite a colleague to co-teach <strong className="text-white">"{state.className}"</strong>. When they log in with their Google account, they will automatically gain access to this classroom.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-mono text-[#94A3B8] mb-1">
                  Colleague's Gmail or School Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teacher@school.edu or name@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-[#121824] border border-[#2B3950] rounded-lg text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-mono text-[#94A3B8] mb-1">
                  Assigned Permission Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#121824] border border-[#2B3950] rounded-lg text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
                >
                  <option value="co-teacher">Co-Teacher (Can manage decks, rosters, & quizzes)</option>
                  <option value="department-head">Department Head (Full curriculum access)</option>
                  <option value="ta">Teaching Assistant / TA (Quiz and grading support)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-[#1C2433] hover:bg-[#2B3A54] text-[#CBD5E1] text-xs font-mono uppercase tracking-wider rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-lg cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Educator Account Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#182234] border border-[#EF4444]/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-left">
            <div className="flex items-center gap-2.5 text-[#EF4444] border-b border-[#2D3B52] pb-3">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-mono text-sm uppercase tracking-wider font-semibold">
                Delete Educator Account?
              </h3>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed font-sans">
              Are you sure you want to permanently remove the educator account for{' '}
              <strong className="text-white">{teacherToDelete.name}</strong> (
              <span className="font-mono text-blue-300">{teacherToDelete.email}</span>)?
            </p>

            <div className="bg-[#2A1616] border border-[#EF4444]/30 p-3.5 rounded-xl text-[11px] font-mono text-[#FCA5A5] space-y-1">
              <div className="font-semibold uppercase tracking-wider">Warning &mdash; Immediate deletion will:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[#FECACA]">
                <li>Erase all {getClassesForTeacher(teacherToDelete.id, teacherToDelete.email).length} classes created under this account</li>
                <li>Remove all associated student rosters, PINs, and quiz submissions</li>
                <li>Delete weekly presentation decks, question banks, and grading records</li>
              </ul>
            </div>

            {teacherToDelete.id === currentTeacher.id && (
              <p className="text-[11px] font-mono text-[#94A3B8]">
                Since you are deleting your currently active session, you will be logged out immediately.
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 bg-[#1C2433] hover:bg-[#2B3A54] border border-[#2B3950] text-[#CBD5E1] text-xs font-mono uppercase tracking-wider rounded-lg cursor-pointer transition"
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

