import React, { useState } from 'react';
import { ClassroomState, Question, Student, Week, QuizSubmission } from '../../types';
import { playClickSound, playStampSound, playSuccessChime } from '../../utils/sound';
import { 
  saveClassroomState,
  clearStudentQuizScore,
  clearAllScoresForWeek,
  clearAllScoresForStudent,
  clearAllClassroomScores
} from '../../utils/storage';
import { 
  Users, 
  Presentation, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  Printer, 
  Eye, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle, 
  Check, 
  Clock,
  RotateCcw,
  Trash2,
  Eraser,
  AlertOctagon
} from 'lucide-react';

interface ResultsTabProps {
  state: ClassroomState;
  onUpdateState?: (newState: ClassroomState) => void;
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ state, onUpdateState }) => {
  const publishedWeeks = state.weeks.filter((w) => w.status === 'published');
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(
    publishedWeeks.length > 0 ? publishedWeeks[0].id : null
  );
  const [viewMode, setViewMode] = useState<'individual' | 'class'>('individual');
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Armed states for quick inline actions
  const [armedClearStudentId, setArmedClearStudentId] = useState<string | null>(null);

  // Modal confirmation states
  const [confirmModal, setConfirmModal] = useState<{
    type: 'single' | 'week' | 'all' | 'student-all';
    studentId?: string;
    studentName?: string;
    weekId?: string;
    weekTitle?: string;
    submissionCount?: number;
  } | null>(null);

  // Score reset options management hub modal
  const [showScoreResetHub, setShowScoreResetHub] = useState(false);
  const [selectedStudentForWeekReset, setSelectedStudentForWeekReset] = useState<string>('');
  const [selectedStudentForAllReset, setSelectedStudentForAllReset] = useState<string>('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const selectedWeek = state.weeks.find((w) => w.id === selectedWeekId) || null;

  if (publishedWeeks.length === 0) {
    return (
      <div className="border border-dashed border-[#1F1F1F] rounded-2xl p-12 text-center bg-[#161616]">
        <Presentation className="w-10 h-10 text-[#666666] mx-auto mb-2" />
        <h4 className="font-serif italic text-xl text-white mb-1">
          No Published Quizzes Yet
        </h4>
        <p className="text-xs text-[#888888] max-w-md mx-auto font-light">
          Publish a weekly check-in from the <strong className="text-white">Weeks &amp; Quizzes</strong> tab so students can submit their answers and generate analytics.
        </p>
      </div>
    );
  }

  // Calculate stats for selected week
  const studentSubmissions = state.students
    .map((s) => ({
      student: s,
      result: selectedWeek ? (state.results[s.id] || {})[selectedWeek.id] || null : null,
    }));

  const submittedRows = studentSubmissions.filter((x) => x.result !== null);
  const totalEnrolled = state.students.length;
  const submittedCount = submittedRows.length;

  // Total scores across all weeks in classroom
  const totalClassSubmissionsCount = Object.values(state.results).reduce(
    (acc, studentMap) => acc + Object.keys(studentMap || {}).length,
    0
  );

  const classAverage =
    submittedCount > 0
      ? Math.round(
          submittedRows.reduce((acc, row) => acc + (row.result!.score / row.result!.total) * 100, 0) /
            submittedCount
        )
      : 0;

  // Question-by-question breakdown
  const questionStats = (selectedWeek?.quiz || []).map((q, qi) => {
    const missedCount = submittedRows.filter((r) => r.result!.answers[qi] !== q.correctIndex).length;
    const missPct = submittedCount > 0 ? Math.round((missedCount / submittedCount) * 100) : 0;
    return {
      index: qi,
      question: q,
      missedCount,
      correctCount: submittedCount - missedCount,
      missPct,
    };
  });

  const struggleRanked = [...questionStats].sort((a, b) => b.missPct - a.missPct);
  const actionableItems = struggleRanked.filter((item) => item.missPct >= 20).slice(0, 4);

  // Clear single student's score for current week
  const handlePerformClearSingleScore = (studentId: string, studentName: string) => {
    if (!selectedWeek) return;

    // Create updated results map
    const newResults = { ...state.results };
    if (newResults[studentId]) {
      const studentMap = { ...newResults[studentId] };
      delete studentMap[selectedWeek.id];
      if (Object.keys(studentMap).length === 0) {
        delete newResults[studentId];
      } else {
        newResults[studentId] = studentMap;
      }
    }

    const updatedState: ClassroomState = {
      ...state,
      results: newResults,
    };

    saveClassroomState(updatedState);
    if (onUpdateState) {
      onUpdateState(updatedState);
    }

    // Also persist via explicit helper
    if (state.id) {
      clearStudentQuizScore(state.id, studentId, selectedWeek.id);
    }

    playStampSound();
    setConfirmModal(null);
    setArmedClearStudentId(null);
    if (inspectedStudentId === studentId) {
      setInspectedStudentId(null);
    }

    showToast(`Cleared ${studentName}'s score on "${selectedWeek.title}". The student can now re-take the quiz.`);
  };

  // Clear all scores for current week
  const handlePerformClearWeekScores = () => {
    if (!selectedWeek) return;

    const newResults = { ...state.results };
    Object.keys(newResults).forEach((sId) => {
      if (newResults[sId] && newResults[sId][selectedWeek.id]) {
        const studentMap = { ...newResults[sId] };
        delete studentMap[selectedWeek.id];
        if (Object.keys(studentMap).length === 0) {
          delete newResults[sId];
        } else {
          newResults[sId] = studentMap;
        }
      }
    });

    const updatedState: ClassroomState = {
      ...state,
      results: newResults,
    };

    saveClassroomState(updatedState);
    if (onUpdateState) {
      onUpdateState(updatedState);
    }

    if (state.id) {
      clearAllScoresForWeek(state.id, selectedWeek.id);
    }

    playStampSound();
    setConfirmModal(null);
    showToast(`Cleared all ${submittedCount} submissions for "${selectedWeek.title}". All students may now retake this assessment.`);
  };

  // Clear all quiz scores for a specific student across all weeks
  const handlePerformClearStudentAllScores = (studentId: string, studentName: string) => {
    const newResults = { ...state.results };
    delete newResults[studentId];

    const updatedState: ClassroomState = {
      ...state,
      results: newResults,
    };

    saveClassroomState(updatedState);
    if (onUpdateState) {
      onUpdateState(updatedState);
    }

    if (state.id) {
      clearAllScoresForStudent(state.id, studentId);
    }

    playStampSound();
    setConfirmModal(null);
    setArmedClearStudentId(null);
    if (inspectedStudentId === studentId) {
      setInspectedStudentId(null);
    }

    showToast(`Cleared all quiz history for ${studentName} across all weeks.`);
  };

  // Clear all classroom scores across all weeks
  const handlePerformClearAllScores = () => {
    const updatedState: ClassroomState = {
      ...state,
      results: {},
    };

    saveClassroomState(updatedState);
    if (onUpdateState) {
      onUpdateState(updatedState);
    }

    if (state.id) {
      clearAllClassroomScores(state.id);
    }

    playStampSound();
    setConfirmModal(null);
    showToast(`All classroom quiz scores have been cleared successfully.`);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!selectedWeek) return;
    setIsExporting(true);

    const headers = ['Student Name', 'PIN', 'Score', 'Total Questions', 'Percentage', 'Submitted Date'];
    const rows = studentSubmissions.map(({ student, result }) => [
      `"${student.name}"`,
      student.pin,
      result ? result.score : 'N/A',
      result ? result.total : selectedWeek.quiz.length,
      result ? `${Math.round((result.score / result.total) * 100)}%` : 'Not Submitted',
      result ? new Date(result.submittedAt).toLocaleDateString() : '—',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedWeek.title.replace(/[^a-z0-9]/gi, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const inspectedStudent = state.students.find((s) => s.id === inspectedStudentId);
  const inspectedResult =
    inspectedStudent && selectedWeek ? (state.results[inspectedStudent.id] || {})[selectedWeek.id] : null;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-[#1F1F1F] border border-[var(--gold)]/50 text-white p-3.5 rounded-xl text-xs font-mono flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#22C55E] shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[#888888] hover:text-white text-xs cursor-pointer ml-3 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h2 className="font-serif italic text-2xl text-white">
            Assessment Results &amp; Analytics<span className="text-[#888888]">.</span>
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-[#888888] mt-1">
            Monitor student mastery, review answers, or reset scores for re-testing.
          </p>
        </div>

        {/* Week Selector Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            id="results-week-select"
            value={selectedWeek?.id || ''}
            onChange={(e) => {
              playClickSound();
              setSelectedWeekId(e.target.value);
            }}
            className="px-3.5 py-2 bg-[#161616] border border-[#1F1F1F] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#555555] cursor-pointer"
          >
            {publishedWeeks.map((w) => (
              <option key={w.id} value={w.id} className="bg-[#161616] text-white">
                {w.title}
              </option>
            ))}
          </select>

          {/* Clear Week Scores Button */}
          {submittedCount > 0 && selectedWeek && (
            <button
              id="clear-week-scores-btn"
              onClick={() => {
                playClickSound();
                setConfirmModal({
                  type: 'week',
                  weekId: selectedWeek.id,
                  weekTitle: selectedWeek.title,
                  submissionCount: submittedCount,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#161616] hover:bg-[#201010] border border-[#2A2A2A] hover:border-[#EF4444]/60 text-[#AAAAAA] hover:text-[#EF4444] rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer"
              title="Clear all scores for this quiz to allow students to re-take"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Clear Week Scores ({submittedCount})</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            id="export-results-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#161616] border border-[#1F1F1F] hover:border-[#333333] rounded-lg text-xs font-mono uppercase tracking-wider text-white transition cursor-pointer"
            title="Download CSV of student scores"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Export CSV</span>
          </button>

          {/* Global Classroom Scores Reset Option */}
          {totalClassSubmissionsCount > 0 && (
            <button
              id="clear-all-classroom-scores-btn"
              onClick={() => {
                playClickSound();
                setConfirmModal({
                  type: 'all',
                  submissionCount: totalClassSubmissionsCount,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#161616] hover:bg-[#201010] border border-[#2A2A2A] hover:border-[#EF4444]/60 text-[#777777] hover:text-[#EF4444] rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer"
              title="Clear all scores across all quizzes in this class"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#888888]" />
              <span>Clear All Quizzes</span>
            </button>
          )}

          {/* Dedicated Score Reset Hub / Management Button */}
          <button
            id="open-score-reset-hub-btn"
            onClick={() => {
              playClickSound();
              setShowScoreResetHub(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#161616] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#D4AF37]/50 rounded-lg text-xs font-mono uppercase tracking-wider text-[#D4AF37] transition cursor-pointer"
            title="Open comprehensive student score reset options"
          >
            <Eraser className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Score Reset Options</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 border-b border-[#1F1F1F]">
        <button
          id="view-individual-results-tab"
          onClick={() => {
            playClickSound();
            setViewMode('individual');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[11px] font-mono uppercase tracking-wider transition cursor-pointer border-t border-x ${
            viewMode === 'individual'
              ? 'bg-[#161616] border-white/50 text-white font-bold -mb-px'
              : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#666666] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-white" />
          <span>Individual Submissions</span>
        </button>

        <button
          id="view-class-overview-tab"
          onClick={() => {
            playClickSound();
            setViewMode('class');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[11px] font-mono uppercase tracking-wider transition cursor-pointer border-t border-x ${
            viewMode === 'class'
              ? 'bg-[#161616] border-white/50 text-white font-bold -mb-px'
              : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#666666] hover:text-white'
          }`}
        >
          <Presentation className="w-3.5 h-3.5 text-white" />
          <span>Class Overview</span>
        </button>
      </div>

      {/* Main Panel Body */}
      <div className="bg-[#161616] border border-[#1F1F1F] border-t-0 rounded-b-2xl p-6 shadow-xl">
        {/* VIEW 1: Individual Results */}
        {viewMode === 'individual' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-[#888888]">
                Confidential student submissions for <strong className="text-white">{selectedWeek?.title}</strong>. Teachers can inspect answers or clear individual scores to allow retakes.
              </p>
              <span className="font-mono text-xs bg-[#121212] text-[#D4AF37] font-semibold px-3 py-1 rounded-md border border-[#1F1F1F]">
                {submittedCount} of {totalEnrolled} Submissions
              </span>
            </div>

            <div className="bg-[#121212] border border-[#1F1F1F] rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#161616] border-b border-[#1F1F1F] font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888]">
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">PIN</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Percentage</th>
                      <th className="py-3 px-4">Submission Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]">
                    {studentSubmissions.map(({ student, result }) => {
                      const pct = result ? Math.round((result.score / result.total) * 100) : null;
                      const isArmed = armedClearStudentId === student.id;

                      return (
                        <tr key={student.id} className="hover:bg-[#161616] transition-colors">
                          <td className="py-3.5 px-4 font-medium text-white">
                            {student.name}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-[#888888]">
                            {student.pin}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-white">
                            {result ? `${result.score} / ${result.total}` : '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            {pct !== null ? (
                              <span
                                className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                                  pct >= 80
                                    ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                                    : pct >= 60
                                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                                    : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'
                                }`}
                              >
                                {pct}%
                              </span>
                            ) : (
                              <span className="text-xs text-[#555555] font-mono">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono">
                            {result ? (
                              <span className="text-[#22C55E] font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            ) : (
                              <span className="text-[#888888] font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {result ? (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  id={`view-student-answers-${student.id}`}
                                  onClick={() => {
                                    playClickSound();
                                    setInspectedStudentId(student.id);
                                  }}
                                  className="px-2.5 py-1 bg-[#161616] border border-[#1F1F1F] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] rounded-lg text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition"
                                  title="Inspect question-by-question student answers"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>Inspect</span>
                                </button>

                                <button
                                  id={`clear-student-score-${student.id}`}
                                  onClick={() => {
                                    if (isArmed) {
                                      handlePerformClearSingleScore(student.id, student.name);
                                    } else {
                                      playClickSound();
                                      setArmedClearStudentId(student.id);
                                      setTimeout(() => {
                                        setArmedClearStudentId((prev) => (prev === student.id ? null : prev));
                                      }, 3500);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition border ${
                                    isArmed
                                      ? 'bg-[#EF4444] text-white border-[#EF4444] animate-pulse font-bold'
                                      : 'bg-[#161616] border-[#1F1F1F] hover:border-[#EF4444]/60 text-[#888888] hover:text-[#EF4444]'
                                  }`}
                                  title="Clear score so student can retake this quiz"
                                >
                                  <RotateCcw className="w-3 h-3 text-[#EF4444]" />
                                  <span>{isArmed ? 'Confirm Clear' : 'Clear Score'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#555555] font-mono uppercase tracking-wider">
                                No Score
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Class Overview (Projector Ready) */}
        {viewMode === 'class' && (
          <div className="space-y-8">
            {/* Header Stamp Card */}
            <div className="text-center py-6 bg-[#121212] border border-[#1F1F1F] rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888] block mb-2">
                Classroom Standing &middot; {selectedWeek?.title}
              </span>

              {/* Sophisticated Dark Class Average Stamp */}
              <div className="ledger-stamp w-32 h-32 rounded-full border border-dashed border-[#D4AF37] mx-auto flex flex-col items-center justify-center bg-[#161616] my-3 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <span className="font-mono text-4xl font-bold text-[#D4AF37] leading-none">
                  {submittedCount > 0 ? `${classAverage}%` : '—'}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888] mt-1">
                  Class Average
                </span>
              </div>

              <p className="text-xs text-[#888888] font-mono mt-3 font-light">
                {submittedCount} of {totalEnrolled} students submitted &middot; Culminating Readiness:{' '}
                <strong className={`ml-1 ${classAverage >= 75 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {classAverage >= 80 ? 'HIGH' : classAverage >= 65 ? 'MODERATE' : 'NEEDS TARGETED REVISION'}
                </strong>
              </p>
            </div>

            {/* Struggle & Question Distribution Chart */}
            <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-serif italic text-xl text-white">
                    Where the Class Struggled (Question Breakdown)<span className="text-[#D4AF37]">.</span>
                  </h4>
                  <p className="text-xs text-[#888888] font-light">
                    Higher bars represent questions where a larger percentage of students made errors.
                  </p>
                </div>
              </div>

              {/* CSS Bar Chart of 20 questions */}
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-20 gap-1.5 items-end h-40 pt-6 pb-2 border-b border-[#1F1F1F]">
                {questionStats.map((stat) => {
                  const isHighMiss = stat.missPct >= 35;
                  const isModerateMiss = stat.missPct >= 20;

                  return (
                    <div key={stat.index} className="flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:block absolute bottom-full mb-2 bg-[#0A0A0A] border border-[#1F1F1F] text-white text-[10px] p-2.5 rounded-lg shadow-2xl z-20 w-48 pointer-events-none font-mono">
                        <div className="font-bold text-[#D4AF37]">Q{stat.index + 1}: {stat.missPct}% Missed</div>
                        <div className="text-[9px] mt-1 line-clamp-2 text-[#888888]">{stat.question.question}</div>
                      </div>

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isHighMiss
                            ? 'bg-[#EF4444]'
                            : isModerateMiss
                            ? 'bg-[#D4AF37]'
                            : 'bg-[#22C55E]'
                        }`}
                        style={{ height: `${Math.max(8, stat.missPct)}%` }}
                      />

                      {/* Label */}
                      <span className="font-mono text-[9px] text-[#666666] mt-1.5">
                        Q{stat.index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-[#888888] pt-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]" />
                    <span>&lt;20% Missed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37]" />
                    <span>20-35% Missed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
                    <span>&gt;35% Missed (Action Required)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actionable Review Section */}
            <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-6 shadow-lg">
              <h4 className="font-serif italic text-xl text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
                <span>Targeted Review Recommendations for Class Discussion</span>
              </h4>
              <p className="text-xs text-[#888888] mb-4">
                Prioritize these high-error concepts during lecture warm-up before progressing to next week's material:
              </p>

              {actionableItems.length === 0 ? (
                <div className="bg-[#161616] p-4 rounded-xl border border-[#1F1F1F] text-xs text-[#22C55E] font-mono">
                  <strong>Exceptional Unit Readiness!</strong> No question exceeded the 20% classroom error threshold. Students are well-prepared for the culminating assessment.
                </div>
              ) : (
                <div className="space-y-3">
                  {actionableItems.map((item) => (
                    <div
                      key={item.index}
                      className="p-4 bg-[#161616] border border-[#1F1F1F] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#D4AF37] font-bold">
                            Question {item.index + 1}
                          </span>
                          <span className="text-[9px] font-mono bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {item.missPct}% Class Error Rate
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white">{item.question.question}</p>
                        {item.question.explanation && (
                          <p className="text-xs text-[#888888] italic font-serif">
                            Key Concept: {item.question.explanation}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs text-[#888888]">
                          {item.missedCount} students need review
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL for Clearing Scores */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-2.5 text-[#EF4444] border-b border-[#262626] pb-3">
              <AlertOctagon className="w-5 h-5 text-[#EF4444]" />
              <h3 className="font-serif italic text-lg text-white">
                {confirmModal.type === 'single'
                  ? `Clear Score for ${confirmModal.studentName}?`
                  : confirmModal.type === 'week'
                  ? `Clear All Scores for "${confirmModal.weekTitle}"?`
                  : confirmModal.type === 'student-all'
                  ? `Reset All Quiz History for ${confirmModal.studentName}?`
                  : 'Clear All Scores Across All Quizzes?'}
              </h3>
            </div>

            <p className="text-xs text-[#888888] font-mono leading-relaxed">
              {confirmModal.type === 'single' && (
                <>
                  This will delete <strong className="text-white">{confirmModal.studentName}</strong>'s score on <strong className="text-white">{confirmModal.weekTitle}</strong>. The student will be able to log in with their PIN and retake the quiz immediately.
                </>
              )}
              {confirmModal.type === 'week' && (
                <>
                  This will remove all <strong className="text-white">{confirmModal.submissionCount} submissions</strong> for <strong className="text-white">{confirmModal.weekTitle}</strong>. All enrolled students will be able to retake this quiz module.
                </>
              )}
              {confirmModal.type === 'student-all' && (
                <>
                  This will delete all quiz submissions across all weeks for <strong className="text-white">{confirmModal.studentName}</strong>. The student will have a clean slate to take all quizzes.
                </>
              )}
              {confirmModal.type === 'all' && (
                <>
                  This will delete all <strong className="text-white">{confirmModal.submissionCount} submissions</strong> across all published weekly quizzes in this class. All students can start fresh with new attempts.
                </>
              )}
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#2A2A2A] text-[#888888] hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                id="confirm-action-clear-btn"
                onClick={() => {
                  if (confirmModal.type === 'single' && confirmModal.studentId && confirmModal.studentName) {
                    handlePerformClearSingleScore(confirmModal.studentId, confirmModal.studentName);
                  } else if (confirmModal.type === 'student-all' && confirmModal.studentId && confirmModal.studentName) {
                    handlePerformClearStudentAllScores(confirmModal.studentId, confirmModal.studentName);
                  } else if (confirmModal.type === 'week') {
                    handlePerformClearWeekScores();
                  } else if (confirmModal.type === 'all') {
                    handlePerformClearAllScores();
                  }
                }}
                className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-lg cursor-pointer transition shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCORE RESET HUB MODAL */}
      {showScoreResetHub && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                  <Eraser className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-serif italic text-xl text-white">
                    Score Management &amp; Clear Options
                  </h3>
                  <p className="text-[11px] font-mono text-[#888888]">
                    Select an option below to clear individual scores or perform classroom resets.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScoreResetHub(false)}
                className="text-[#888888] hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Option 1: Clear Individual Student Score for Current Week */}
              {selectedWeek && (
                <div className="bg-[#181818] border border-[#262626] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block">
                        Option 1 &middot; Single Student on Selected Quiz
                      </span>
                      <h4 className="font-medium text-sm text-white mt-0.5">
                        Clear a student's score on "{selectedWeek.title}"
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-[#888888] font-light">
                    Allows the student to log back in and retake only this specific weekly check-in.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                    <select
                      id="reset-hub-student-week-select"
                      value={selectedStudentForWeekReset}
                      onChange={(e) => setSelectedStudentForWeekReset(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#121212] border border-[#2A2A2A] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    >
                      <option value="">-- Choose a student --</option>
                      {state.students
                        .filter((s) => Boolean((state.results[s.id] || {})[selectedWeek.id]))
                        .map((s) => {
                          const sub = (state.results[s.id] || {})[selectedWeek.id];
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} (Score: {sub.score}/{sub.total} - {Math.round((sub.score / sub.total) * 100)}%)
                            </option>
                          );
                        })}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedStudentForWeekReset}
                      onClick={() => {
                        const stu = state.students.find((s) => s.id === selectedStudentForWeekReset);
                        if (!stu) return;
                        setShowScoreResetHub(false);
                        setConfirmModal({
                          type: 'single',
                          studentId: stu.id,
                          studentName: stu.name,
                          weekId: selectedWeek.id,
                          weekTitle: selectedWeek.title,
                        });
                      }}
                      className="px-3.5 py-2 bg-[#201010] hover:bg-[#301515] border border-[#EF4444]/40 text-[#EF4444] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Score</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Option 2: Clear Entire Week's Scores */}
              {selectedWeek && (
                <div className="bg-[#181818] border border-[#262626] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block">
                        Option 2 &middot; Current Module Submissions
                      </span>
                      <h4 className="font-medium text-sm text-white mt-0.5">
                        Clear all scores for "{selectedWeek.title}" ({submittedCount} Submissions)
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-[#888888] font-light">
                    Clears all submissions for this weekly quiz. All students can re-attempt this assessment.
                  </p>
                  <button
                    type="button"
                    disabled={submittedCount === 0}
                    onClick={() => {
                      setShowScoreResetHub(false);
                      setConfirmModal({
                        type: 'week',
                        weekId: selectedWeek.id,
                        weekTitle: selectedWeek.title,
                        submissionCount: submittedCount,
                      });
                    }}
                    className="px-4 py-2 bg-[#201010] hover:bg-[#301515] border border-[#EF4444]/40 text-[#EF4444] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All {submittedCount} Submissions for This Week</span>
                  </button>
                </div>
              )}

              {/* Option 3: Clear All Quiz Attempts for a Specific Student Across ALL Weeks */}
              <div className="bg-[#181818] border border-[#262626] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block">
                      Option 3 &middot; Student Full History Reset
                    </span>
                    <h4 className="font-medium text-sm text-white mt-0.5">
                      Clear a student's scores across ALL weekly quizzes
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-[#888888] font-light">
                  Removes all submitted quizzes for a selected student so they can take all weeks from scratch.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <select
                    id="reset-hub-student-all-select"
                    value={selectedStudentForAllReset}
                    onChange={(e) => setSelectedStudentForAllReset(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#121212] border border-[#2A2A2A] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="">-- Choose a student --</option>
                    {state.students
                      .filter((s) => Object.keys(state.results[s.id] || {}).length > 0)
                      .map((s) => {
                        const count = Object.keys(state.results[s.id] || {}).length;
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} ({count} quiz {count === 1 ? 'submission' : 'submissions'})
                          </option>
                        );
                      })}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedStudentForAllReset}
                    onClick={() => {
                      const stu = state.students.find((s) => s.id === selectedStudentForAllReset);
                      if (!stu) return;
                      setShowScoreResetHub(false);
                      setConfirmModal({
                        type: 'student-all',
                        studentId: stu.id,
                        studentName: stu.name,
                      });
                    }}
                    className="px-3.5 py-2 bg-[#201010] hover:bg-[#301515] border border-[#EF4444]/40 text-[#EF4444] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Scores for Student</span>
                  </button>
                </div>
              </div>

              {/* Option 4: Full Classroom Reset */}
              <div className="bg-[#181818] border border-[#EF4444]/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-[#EF4444] tracking-wider block">
                      Option 4 &middot; Entire Classroom Reset
                    </span>
                    <h4 className="font-medium text-sm text-white mt-0.5">
                      Clear ALL scores across all quizzes and all students ({totalClassSubmissionsCount} Total Submissions)
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-[#888888] font-light">
                  Completely wipes all quiz submission history in the classroom ledger for a fresh term or assessment period.
                </p>
                <button
                  type="button"
                  disabled={totalClassSubmissionsCount === 0}
                  onClick={() => {
                    setShowScoreResetHub(false);
                    setConfirmModal({
                      type: 'all',
                      submissionCount: totalClassSubmissionsCount,
                    });
                  }}
                  className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe All Classroom Quiz Records</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setShowScoreResetHub(false)}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#2A2A2A] text-white rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTED STUDENT MODAL */}
      {inspectedStudent && inspectedResult && selectedWeek && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#1F1F1F] flex items-center justify-between bg-[#161616] flex-wrap gap-3">
              <div>
                <span className="text-[9px] font-mono text-[#D4AF37] font-bold uppercase tracking-[0.2em] block">
                  Exam Submission Inspection
                </span>
                <h3 className="font-serif italic text-xl text-white">
                  {inspectedStudent.name} &middot; {selectedWeek.title}
                </h3>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold bg-[#0A0A0A] border border-[#1F1F1F] text-[#D4AF37] px-3 py-1.5 rounded-lg">
                  Score: {inspectedResult.score} / {inspectedResult.total} (
                  {Math.round((inspectedResult.score / inspectedResult.total) * 100)}%)
                </span>

                <button
                  id="modal-clear-this-score-btn"
                  onClick={() => {
                    playClickSound();
                    setConfirmModal({
                      type: 'single',
                      studentId: inspectedStudent.id,
                      studentName: inspectedStudent.name,
                      weekId: selectedWeek.id,
                      weekTitle: selectedWeek.title,
                    });
                  }}
                  className="px-3 py-1.5 bg-[#201010] hover:bg-[#2F1515] border border-[#EF4444]/40 text-[#EF4444] hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition"
                  title="Clear this student's score and allow them to re-take"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Clear Score &amp; Allow Retake</span>
                </button>

                <button
                  onClick={() => setInspectedStudentId(null)}
                  className="px-3.5 py-1.5 bg-[#121212] border border-[#1F1F1F] hover:border-[#333333] text-white rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-[#0A0A0A]">
              {selectedWeek.quiz.map((q, qi) => {
                const chosen = inspectedResult.answers[qi];
                const isCorrect = chosen === q.correctIndex;

                return (
                  <div
                    key={qi}
                    className={`p-4 rounded-xl border ${
                      isCorrect ? 'bg-[#121212] border-[#1F1F1F]' : 'bg-[#121212] border-[#EF4444]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-[#888888]">
                        Question {qi + 1}
                      </span>
                      {isCorrect ? (
                        <span className="text-xs font-mono text-[#22C55E] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Correct (+1)
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-[#EF4444] font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect (0)
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-sm text-white mb-3">
                      {q.question}
                    </p>

                    <div className="space-y-1.5 text-xs">
                      {q.options.map((opt, oi) => {
                        const isStudentChoice = oi === chosen;
                        const isTheCorrectAnswer = oi === q.correctIndex;

                        return (
                          <div
                            key={oi}
                            className={`p-2.5 rounded-lg border flex items-center justify-between ${
                              isTheCorrectAnswer
                                ? 'bg-[#22C55E]/10 border-[#22C55E]/40 font-medium text-[#22C55E]'
                                : isStudentChoice
                                ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444] line-through'
                                : 'bg-[#161616] border-[#1F1F1F] text-[#888888]'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + oi)}. {opt}
                            </span>
                            {isTheCorrectAnswer && (
                              <span className="text-[9px] uppercase font-mono font-bold">
                                Correct Answer
                              </span>
                            )}
                            {isStudentChoice && !isTheCorrectAnswer && (
                              <span className="text-[9px] uppercase font-mono font-bold">
                                Selected
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
