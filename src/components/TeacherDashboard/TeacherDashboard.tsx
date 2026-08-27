import React, { useState } from 'react';
import { ClassroomState, Teacher, TeacherTab, ClassroomData } from '../../types';
import { StudentsTab } from './StudentsTab';
import { WeeksTab } from './WeeksTab';
import { ResultsTab } from './ResultsTab';
import { FacultyTab } from './FacultyTab';
import {
  getClassesForTeacher,
  addClassToTeacher,
  setActiveClassForTeacher,
  deleteClassForTeacher,
  updateClassData,
  buildClassroomStateFromClass,
  loadAppStore,
} from '../../utils/storage';
import { playClickSound, playSuccessChime } from '../../utils/sound';
import {
  Users,
  Layers,
  BarChart3,
  School,
  UserPlus,
  ArrowRightLeft,
  ChevronDown,
  Shield,
  LogOut,
  Plus,
  Settings2,
  Trash2,
  Check,
  BookOpen,
} from 'lucide-react';

interface TeacherDashboardProps {
  state: ClassroomState;
  currentTeacher: Teacher;
  onUpdateState: (newState: ClassroomState) => void;
  onSwitchAccount?: () => void;
  onAddCoTeacher?: () => void;
  onLogout?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  state,
  currentTeacher,
  onUpdateState,
  onSwitchAccount,
  onAddCoTeacher,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('students');
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState(currentTeacher.subject || 'General Studies');
  const [newPeriod, setNewPeriod] = useState('Period 1');
  const [newUnitGoal, setNewUnitGoal] = useState('');
  const [newCulminatingTitle, setNewCulminatingTitle] = useState('');

  // Edit Class Form State
  const [editClassName, setEditClassName] = useState(state.className);
  const [editSubject, setEditSubject] = useState(state.subject || '');
  const [editPeriod, setEditPeriod] = useState(state.period || '');
  const [editUnitGoal, setEditUnitGoal] = useState(state.unitGoal);
  const [editCulminatingTitle, setEditCulminatingTitle] = useState(state.culminatingActivityTitle);

  // Get only this teacher's isolated classes
  const teacherClasses = getClassesForTeacher(currentTeacher.id);

  // Switch active class for this teacher
  const handleSelectClass = (classId: string) => {
    playClickSound();
    setShowClassMenu(false);
    const targetClass = setActiveClassForTeacher(currentTeacher.id, classId);
    const store = loadAppStore();
    const updatedState = buildClassroomStateFromClass(targetClass, currentTeacher, store.teachers);
    onUpdateState(updatedState);
  };

  // Create a new separate class for this teacher
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const freshClass = addClassToTeacher(
      currentTeacher.id,
      newClassName.trim(),
      newSubject.trim() || 'General Studies',
      newPeriod.trim() || 'Period 1',
      newUnitGoal.trim() || 'Master weekly presentation concepts and key curriculum objectives.',
      newCulminatingTitle.trim() || 'Final Unit Socratic Examination'
    );

    const store = loadAppStore();
    const updatedState = buildClassroomStateFromClass(freshClass, currentTeacher, store.teachers);
    onUpdateState(updatedState);

    setNewClassName('');
    setShowCreateClassModal(false);
    setShowClassMenu(false);
    playSuccessChime();
  };

  // Update existing class settings
  const handleSaveClassEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClassName.trim()) return;

    const updatedState: ClassroomState = {
      ...state,
      className: editClassName.trim(),
      subject: editSubject.trim() || state.subject,
      period: editPeriod.trim() || state.period,
      unitGoal: editUnitGoal.trim() || state.unitGoal,
      culminatingActivityTitle: editCulminatingTitle.trim() || state.culminatingActivityTitle,
    };

    onUpdateState(updatedState);
    setShowEditClassModal(false);
    playSuccessChime();
  };

  // Delete a class
  const handleDeleteClass = (classId: string, className: string) => {
    if (teacherClasses.length <= 1) {
      alert('You must have at least one active classroom in your account.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to permanently delete class "${className}" and all its student rosters and quiz data?`);
    if (!confirmed) return;

    deleteClassForTeacher(currentTeacher.id, classId);
    const remainingClasses = getClassesForTeacher(currentTeacher.id);
    const active = remainingClasses[0];
    const store = loadAppStore();
    const updatedState = buildClassroomStateFromClass(active, currentTeacher, store.teachers);
    onUpdateState(updatedState);
    playSuccessChime();
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Classroom Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#121212] border border-[#1F1F1F] p-5 rounded-sm shadow-xl relative">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full border border-[var(--gold)]/50 bg-[#161616] flex items-center justify-center font-bold font-serif italic text-lg text-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.15)] shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif italic text-xl md:text-2xl text-white">
                <span>{state.className}</span>
                <span className="text-[var(--gold)]">.</span>
              </h2>

              {state.classCode && (
                <span className="text-[10px] font-mono uppercase tracking-wider bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30 px-2 py-0.5 rounded-xs">
                  Code: {state.classCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#888888] font-mono mt-1 flex-wrap">
              <span>
                Educator: <strong className="text-[var(--gold)] font-medium">{currentTeacher.name}</strong>
              </span>
              <span>&middot;</span>
              <span>{currentTeacher.email}</span>
              <span>&middot;</span>

              {/* Class Switcher Button */}
              <button
                type="button"
                id="class-menu-toggle-btn"
                onClick={() => {
                  playClickSound();
                  setShowClassMenu(!showClassMenu);
                }}
                className="inline-flex items-center gap-1.5 text-[11px] text-[var(--gold)] bg-[#1A1A1A] border border-[var(--gold)]/30 hover:border-[var(--gold)] px-2.5 py-0.5 rounded-xs transition cursor-pointer"
              >
                <span>My Classes ({teacherClasses.length})</span>
                <ChevronDown className="w-3 h-3 text-[var(--gold)]" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end lg:self-auto flex-wrap">
          {/* Culminating Objective Widget */}
          <div className="text-left sm:text-right text-xs font-mono text-[#888888] bg-[#161616] border border-[#1F1F1F] px-3.5 py-2 rounded-xs">
            <span className="text-[9px] uppercase tracking-widest block text-[var(--gold)] font-semibold">
              Culminating Objective
            </span>
            <span className="font-medium text-white max-w-xs line-clamp-1">
              {state.culminatingActivityTitle || state.unitGoal}
            </span>
          </div>

          {/* Edit Class Settings */}
          <button
            type="button"
            id="edit-class-settings-btn"
            onClick={() => {
              playClickSound();
              setEditClassName(state.className);
              setEditSubject(state.subject || '');
              setEditPeriod(state.period || '');
              setEditUnitGoal(state.unitGoal);
              setEditCulminatingTitle(state.culminatingActivityTitle);
              setShowEditClassModal(true);
            }}
            className="p-2 bg-[#161616] hover:bg-[#202020] border border-[#262626] hover:border-[#444444] text-[#AAAAAA] hover:text-white rounded-xs transition cursor-pointer"
            title="Edit Class Settings & Goals"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {onLogout && (
            <button
              id="teacher-banner-logout-btn"
              type="button"
              onClick={() => {
                playClickSound();
                onLogout();
              }}
              className="px-3 py-2 bg-[#161616] hover:bg-[#201010] border border-[#2A2A2A] hover:border-[#EF4444]/60 text-[#AAAAAA] hover:text-[#EF4444] rounded-xs text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition"
              title="Log out of isolated educator account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          )}
        </div>

        {/* Classes Popover Menu */}
        {showClassMenu && (
          <div className="absolute left-4 top-20 sm:left-16 z-30 w-84 bg-[#161616] border border-[#2A2A2A] rounded-sm p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] font-semibold flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                <span>My Isolated Classes ({teacherClasses.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowClassMenu(false)}
                className="text-xs text-[#666666] hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {teacherClasses.map((cls) => {
                const isActive = cls.id === state.id;
                return (
                  <div
                    key={cls.id}
                    className={`p-2.5 rounded-xs border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                      isActive
                        ? 'bg-[#1C1C1C] border-[var(--gold)] text-white shadow-xs'
                        : 'bg-[#101010] border-[#222222] text-[#888888] hover:bg-[#161616] hover:text-white'
                    }`}
                    onClick={() => handleSelectClass(cls.id)}
                  >
                    <div className="truncate flex-1">
                      <div className="font-medium text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{cls.className}</span>
                        {isActive && (
                          <span className="text-[9px] bg-[var(--gold)]/20 text-[var(--gold)] px-1 py-0.2 rounded-xs font-mono shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#777777] flex items-center gap-2 mt-0.5">
                        <span>Code: {cls.classCode}</span>
                        <span>&middot;</span>
                        <span>{cls.students.length} students</span>
                      </div>
                    </div>

                    {!isActive && teacherClasses.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls.id, cls.className);
                        }}
                        className="text-[#666666] hover:text-[#EF4444] p-1 transition"
                        title="Delete class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#222222] flex flex-col gap-2">
              <button
                id="create-new-class-btn"
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowCreateClassModal(true);
                  setShowClassMenu(false);
                }}
                className="w-full py-2 px-3 bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/40 text-[var(--gold)] rounded-xs text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create New Class</span>
              </button>

              {onSwitchAccount && (
                <button
                  id="switch-teacher-account-btn"
                  onClick={() => {
                    playClickSound();
                    setShowClassMenu(false);
                    onSwitchAccount();
                  }}
                  className="w-full py-1.5 px-2.5 bg-[#121212] hover:bg-[#1F1F1F] border border-[#222222] hover:border-[var(--gold)]/50 text-[#AAAAAA] hover:text-white rounded-xs text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <ArrowRightLeft className="w-3 h-3 text-[var(--gold)]" />
                  <span>Switch Educator Account</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Create New Class */}
      {showCreateClassModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-sm p-6 max-w-lg w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2 text-white font-serif italic text-xl">
                <School className="w-5 h-5 text-[var(--gold)]" />
                <span>Create Separate Class</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateClassModal(false)}
                className="text-sm text-[#777777] hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#888888] font-mono leading-relaxed">
              Create an isolated classroom under your educator account. It will have its own separate student roster, slide decks, and weekly quizzes.
            </p>

            <form onSubmit={handleCreateClass} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Period 1: AP European History"
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                    Subject / Discipline
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. History, Biology"
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                    Period / Section
                  </label>
                  <input
                    type="text"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    placeholder="e.g. Period 1, Block B"
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                  Culminating Activity / Exam Title
                </label>
                <input
                  type="text"
                  value={newCulminatingTitle}
                  onChange={(e) => setNewCulminatingTitle(e.target.value)}
                  placeholder="e.g. Fall Comprehensive Culminating Exam & Socratic Defense"
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#2A2A2A] text-[#888888] hover:text-white rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--gold)] hover:bg-[#E5C158] text-[#0A0A0A] font-mono font-semibold uppercase tracking-wider rounded-xs text-xs cursor-pointer transition shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Class Settings */}
      {showEditClassModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-sm p-6 max-w-lg w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2 text-white font-serif italic text-xl">
                <Settings2 className="w-5 h-5 text-[var(--gold)]" />
                <span>Edit Class Settings</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEditClassModal(false)}
                className="text-sm text-[#777777] hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveClassEdit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                    Period
                  </label>
                  <input
                    type="text"
                    value={editPeriod}
                    onChange={(e) => setEditPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                  Culminating Activity / Exam Title
                </label>
                <input
                  type="text"
                  value={editCulminatingTitle}
                  onChange={(e) => setEditCulminatingTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-sm text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#888888] mb-1">
                  Unit Goal / Description
                </label>
                <textarea
                  value={editUnitGoal}
                  onChange={(e) => setEditUnitGoal(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xs text-xs text-white focus:outline-none focus:border-[var(--gold)] font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowEditClassModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#2A2A2A] text-[#888888] hover:text-white rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--gold)] hover:bg-[#E5C158] text-[#0A0A0A] font-mono font-semibold uppercase tracking-wider rounded-xs text-xs cursor-pointer transition shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1.5 flex-wrap border-b border-[#1F1F1F]">
          <button
            id="teacher-tab-students"
            onClick={() => {
              playClickSound();
              setActiveTab('students');
            }}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-widest transition cursor-pointer flex items-center gap-2 border-t border-x rounded-t-xs ${
              activeTab === 'students'
                ? 'bg-[#121212] text-white font-bold border-white/50 border-b-2 border-b-[#121212] -mb-px'
                : 'bg-[#0E0E0E] text-[#666666] border-[#1F1F1F] hover:text-white hover:border-[#333333]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-white" />
            <span>Students &amp; PINs ({state.students.length})</span>
          </button>

          <button
            id="teacher-tab-weeks"
            onClick={() => {
              playClickSound();
              setActiveTab('weeks');
            }}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-widest transition cursor-pointer flex items-center gap-2 border-t border-x rounded-t-xs ${
              activeTab === 'weeks'
                ? 'bg-[#121212] text-white font-bold border-white/50 border-b-2 border-b-[#121212] -mb-px'
                : 'bg-[#0E0E0E] text-[#666666] border-[#1F1F1F] hover:text-white hover:border-[#333333]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-white" />
            <span>Weeks &amp; Quizzes ({state.weeks.length})</span>
          </button>

          <button
            id="teacher-tab-results"
            onClick={() => {
              playClickSound();
              setActiveTab('results');
            }}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-widest transition cursor-pointer flex items-center gap-2 border-t border-x rounded-t-xs ${
              activeTab === 'results'
                ? 'bg-[#121212] text-white font-bold border-white/50 border-b-2 border-b-[#121212] -mb-px'
                : 'bg-[#0E0E0E] text-[#666666] border-[#1F1F1F] hover:text-white hover:border-[#333333]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-white" />
            <span>Results &amp; Analytics</span>
          </button>

          <button
            id="teacher-tab-faculty"
            onClick={() => {
              playClickSound();
              setActiveTab('faculty');
            }}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-widest transition cursor-pointer flex items-center gap-2 border-t border-x rounded-t-xs ${
              activeTab === 'faculty'
                ? 'bg-[#121212] text-white font-bold border-white/50 border-b-2 border-b-[#121212] -mb-px'
                : 'bg-[#0E0E0E] text-[#666666] border-[#1F1F1F] hover:text-white hover:border-[#333333]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-white" />
            <span>Account &amp; Classes ({teacherClasses.length})</span>
          </button>
        </div>

        {/* Tab Panel Canvas */}
        <div className="bg-[#121212] border border-[#1F1F1F] border-t-0 rounded-b-sm p-6 sm:p-8 shadow-xl">
          {activeTab === 'students' && (
            <StudentsTab
              state={state}
              currentTeacher={currentTeacher}
              onUpdateState={onUpdateState}
            />
          )}

          {activeTab === 'weeks' && (
            <WeeksTab state={state} onUpdateState={onUpdateState} />
          )}

          {activeTab === 'results' && <ResultsTab state={state} />}

          {activeTab === 'faculty' && (
            <FacultyTab
              state={state}
              currentTeacher={currentTeacher}
              onUpdateState={onUpdateState}
              onSwitchTeacher={(teacher) => {
                if (onSwitchAccount) onSwitchAccount();
              }}
              onDeleteCurrentAccount={onLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
};
